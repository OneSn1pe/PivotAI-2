'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/config/firebase';
import { CareerRoadmap, Milestone, CandidateProfile, UserProgress } from '@/types/user';
import { useRouter } from 'next/navigation';
import CategorizedCareerRoadmap from '@/components/candidate/CategorizedCareerRoadmap';
import { LevelNavigator } from '@/components/navigation/LevelNavigator';
import { SkillTreeView } from '@/components/roadmap/SkillTreeView';
import { LazyMilestoneList } from '@/components/candidate/LazyMilestoneList';
import { generateNextLevel } from '@/services/openai';
import { checkAndUnlockMilestones, isMilestoneUnlocked, getLockedMilestonesWithReasons } from '@/services/milestoneUnlockService';
import { calculateUserLevel } from '@/services/levelProgressService';
import { ProgressTrackingService } from '@/services/progressTracking';

export default function CareerPathPage() {
  const { userProfile } = useAuth();
  const candidateProfile = userProfile as CandidateProfile | null;
  const router = useRouter();
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [viewMode, setViewMode] = useState<'cards' | 'tree'>('cards');
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [generatingNextLevel, setGeneratingNextLevel] = useState(false);
  const [roadmapId, setRoadmapId] = useState<string | null>(null);

  useEffect(() => {
    // Create style element for roadmap-specific navbar styles
    const style = document.createElement('style');
    style.textContent = `
      /* Exact container structure */
      nav > div.max-w-7xl {
        max-width: 80rem !important;
        margin-left: auto !important;
        margin-right: auto !important;
        padding-left: 1rem !important;
        padding-right: 1rem !important;
        position: relative !important;
      }

      /* Ornamental elements */
      nav > div > div.absolute.inset-0 {
        position: absolute !important;
        inset: 0 !important;
        overflow: hidden !important;
        pointer-events: none !important;
        opacity: 0.1 !important;
      }

      /* Main flex container for navbar content */
      nav > div > div.flex {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        height: 4rem !important;
      }
      
      /* Override any sidebar styles that might be affecting the roadmap navbar */
      .sidebar, aside {
        display: none !important;
      }
      
      /* Main content padding to account for navbar */
      .page-content {
        padding-top: 5rem !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    async function fetchRoadmap() {
      if (!userProfile) return;
      
      try {
        const roadmapQuery = query(
          collection(db, 'roadmaps'),
          where('candidateId', '==', userProfile.uid)
        );
        
        const roadmapSnapshot = await getDocs(roadmapQuery);
        
        if (!roadmapSnapshot.empty) {
          const roadmapDoc = roadmapSnapshot.docs[0];
          setRoadmapId(roadmapDoc.id);
          setRoadmap({
            ...roadmapDoc.data() as CareerRoadmap,
            id: roadmapDoc.id,
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching roadmap:', error);
        setLoading(false);
      }
    }
    
    fetchRoadmap();
  }, [userProfile]);
  
  // Load user progress when roadmap changes
  useEffect(() => {
    loadUserProgress();
  }, [roadmap]);

  const loadUserProgress = async () => {
    if (!userProfile || !roadmap) return;
    
    try {
      // Create user progress based on completed milestones in the roadmap
      const completedMilestoneIds = roadmap.milestones
        .filter(m => m.completed)
        .map(m => m.id);
      
      // Calculate max unlocked level based on completed milestones
      let maxUnlockedLevel = 1;
      const levels = Array.from(new Set(roadmap.milestones.map(m => m.level || 1))).sort((a, b) => a - b);
      
      for (const level of levels) {
        const levelMilestones = roadmap.milestones.filter(m => (m.level || 1) === level);
        const completedInLevel = levelMilestones.filter(m => m.completed).length;
        
        if (completedInLevel === levelMilestones.length && levelMilestones.length > 0) {
          // All milestones in this level are completed, so next level should be unlocked
          maxUnlockedLevel = Math.max(maxUnlockedLevel, level + 1);
        }
      }
      
      const userProgress: UserProgress = {
        userId: userProfile.uid,
        currentLevel: 1,
        maxUnlockedLevel,
        completedMilestones: completedMilestoneIds,
        completedMicroMilestones: [],
        achievements: [],
        streakDays: 0,
        lastActiveDate: new Date(),
        skillProficiencies: {}
      };
      
      setUserProgress(userProgress);
      setSelectedLevel(Math.min(selectedLevel || 1, maxUnlockedLevel));
    } catch (error) {
      console.error('Error loading user progress:', error);
    }
  };

  const handleToggleMilestone = async (milestoneId: string, completed: boolean) => {
    if (!roadmap) return;
    
    try {
      // Find the milestone by ID
      const updatedMilestones = roadmap.milestones.map(milestone => 
        milestone.id === milestoneId ? { ...milestone, completed } : milestone
      );
      
      // Update the roadmap in state
      setRoadmap({
        ...roadmap,
        milestones: updatedMilestones,
        updatedAt: new Date(),
      });
      
      // Update in Firestore
      await updateDoc(doc(db, 'roadmaps', roadmap.id), {
        milestones: updatedMilestones,
        updatedAt: new Date(),
      });

      return Promise.resolve();
    } catch (error) {
      console.error('Error updating milestone:', error);
      return Promise.reject(error);
    }
  };

  const handleMilestoneComplete = async (milestoneId: string) => {
    if (!roadmap || !userProgress || !userProfile) return;
    
    // Find the milestone
    const milestone = roadmap.milestones.find(m => m.id === milestoneId);
    if (!milestone) return;
    
    // Toggle completion status
    const isCurrentlyCompleted = milestone.completed;
    await handleToggleMilestone(milestoneId, !isCurrentlyCompleted);
    
    // Update user progress
    let updatedCompletedMilestones: string[];
    if (!isCurrentlyCompleted) {
      // Marking as complete
      updatedCompletedMilestones = [...userProgress.completedMilestones, milestoneId];
    } else {
      // Marking as incomplete
      updatedCompletedMilestones = userProgress.completedMilestones.filter(id => id !== milestoneId);
    }
    
    const updatedUserProgress = {
      ...userProgress,
      completedMilestones: updatedCompletedMilestones
    };
    
    // Get milestone level info
    const milestoneLevel = milestone.level || 1;
    const levelMilestones = roadmap.milestones.filter(m => (m.level || 1) === milestoneLevel);
    const completedLevelMilestones = levelMilestones.filter(m => 
      updatedCompletedMilestones.includes(m.id)
    );
    
    // Update user's level based on completed milestones
    if (!isCurrentlyCompleted) {
      // Call ProgressTrackingService to update the user's level
      const { leveledUp, newLevel } = await ProgressTrackingService.updateUserLevel(
        userProfile.uid,
        roadmap.milestones.map(m => ({
          ...m,
          id: m.id,
          level: m.level || 1
        }))
      );
      
      if (leveledUp && newLevel) {
        // Update local state with new level
        const progressWithLevel = {
          ...updatedUserProgress,
          currentLevel: newLevel,
          maxUnlockedLevel: Math.max(newLevel + 1, userProgress.maxUnlockedLevel || 1)
        };
        setUserProgress(progressWithLevel);
        
        // Check if there are milestones in the next level
        const nextLevelMilestones = roadmap.milestones.filter(m => (m.level || 1) === newLevel + 1);
        if (nextLevelMilestones.length > 0) {
          // Show success message
          alert(`Congratulations! You've reached Level ${newLevel} and unlocked ${nextLevelMilestones.length} new milestones!`);
          
          // Navigate to the new level if we just completed the current selected level
          if (selectedLevel === newLevel - 1) {
            setSelectedLevel(newLevel);
          }
        }
      } else {
        // No level up, just update progress
        setUserProgress(updatedUserProgress);
      }
    } else {
      // Marking as incomplete - also update level in case user is going back
      const { newLevel } = await ProgressTrackingService.updateUserLevel(
        userProfile.uid,
        roadmap.milestones.map(m => ({
          ...m,
          id: m.id,
          level: m.level || 1
        }))
      );
      
      const progressWithLevel = {
        ...updatedUserProgress,
        currentLevel: newLevel
      };
      setUserProgress(progressWithLevel);
    }
  };

  const handleMicroMilestoneComplete = async (microId: string) => {
    // TODO: Mark micro-milestone as complete
    console.log('Micro-milestone completed:', microId);
  };

  const handleSkipLevel = async () => {
    if (!roadmap || !userProgress || !userProfile) return;
    
    // Get incomplete milestones for current level
    const currentLevelMilestones = roadmap.milestones.filter(m => (m.level || 1) === selectedLevel);
    const incompleteMilestones = currentLevelMilestones.filter(m => !m.completed);
    
    if (incompleteMilestones.length === 0) {
      alert('This level is already completed!');
      return;
    }
    
    // Show warning dialog
    const warningMessage = `Are you sure you want to skip Level ${selectedLevel}?\n\n` +
      `You have ${incompleteMilestones.length} incomplete milestone(s) in this level:\n` +
      incompleteMilestones.map(m => `• ${m.title}`).join('\n') +
      `\n\nSkipping will:\n` +
      `• Unlock Level ${selectedLevel + 1} without completing these milestones\n` +
      `• You may miss important skills and knowledge\n` +
      `• You can return to complete these milestones later\n\n` +
      `Continue?`;
    
    if (!confirm(warningMessage)) {
      return;
    }
    
    // Unlock the next level
    const nextLevel = selectedLevel + 1;
    const newMaxUnlockedLevel = Math.max(userProgress.maxUnlockedLevel || 1, nextLevel);
    
    // Update user progress
    const updatedUserProgress = {
      ...userProgress,
      maxUnlockedLevel: newMaxUnlockedLevel,
      // Track that this level was skipped (you might want to add a skippedLevels array to UserProgress type)
    };
    
    setUserProgress(updatedUserProgress);
    
    // Check if there are milestones in the next level
    const nextLevelMilestones = roadmap.milestones.filter(m => (m.level || 1) === nextLevel);
    if (nextLevelMilestones.length > 0) {
      alert(`Level ${nextLevel} has been unlocked! You can return to Level ${selectedLevel} anytime to complete the skipped milestones.`);
      setSelectedLevel(nextLevel);
    } else {
      alert('No milestones found in the next level. You may need to generate new content.');
    }
  };

  const generateLevelData = (milestones: Milestone[], progress: UserProgress) => {
    const levels = Array.from(new Set(milestones.map(m => m.level || 1))).sort((a, b) => a - b);
    
    return levels.map(level => {
      const levelMilestones = milestones.filter(m => (m.level || 1) === level);
      const completedCount = levelMilestones.filter(m => progress.completedMilestones.includes(m.id)).length;
      
      // Check if this level was skipped (unlocked but not completed, and a higher level is unlocked)
      const isSkipped = level < progress.maxUnlockedLevel && 
                       completedCount < levelMilestones.length && 
                       levelMilestones.length > 0;
      
      return {
        level,
        isActive: level === selectedLevel,
        isUnlocked: level <= progress.maxUnlockedLevel || level === 1,
        isCompleted: completedCount === levelMilestones.length && completedCount > 0,
        isSkipped,
        milestoneCount: levelMilestones.length,
        completedCount,
        title: getLevelTitle(level)
      };
    });
  };

  const getLevelTitle = (level: number) => {
    const titles = {
      1: 'Foundation',
      2: 'Building Skills',
      3: 'Advanced Development',
      4: 'Specialization',
      5: 'Expert Level'
    };
    return titles[level as keyof typeof titles] || `Level ${level}`;
  };

  const handleGenerateNextLevel = async () => {
    if (!roadmapId || !userProfile || !roadmap) return;
    
    setGeneratingNextLevel(true);
    try {
      const maxLevel = Math.max(...roadmap.milestones.map(m => m.level || 1));
      const result = await generateNextLevel(roadmapId, userProfile.uid, maxLevel);
      
      if (result.success) {
        // Refresh roadmap data
        const roadmapQuery = query(
          collection(db, 'roadmaps'),
          where('candidateId', '==', userProfile.uid)
        );
        const roadmapSnapshot = await getDocs(roadmapQuery);
        
        if (!roadmapSnapshot.empty) {
          const roadmapDoc = roadmapSnapshot.docs[0];
          setRoadmap({
            ...roadmapDoc.data() as CareerRoadmap,
            id: roadmapDoc.id,
          });
        }
        
        // Switch to the new level
        setSelectedLevel(result.level);
      }
    } catch (error) {
      console.error('Error generating next level:', error);
      alert('Failed to generate next level. Please try again.');
    } finally {
      setGeneratingNextLevel(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
        </div>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-light mb-6 text-gray-900">Career Roadmap</h1>
        <div className="text-center py-12 bg-white rounded-lg">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">No Roadmap Found</h2>
          <p className="text-gray-600 mb-6">
            You can generate a personalized career path based on your resume and professional goals.
          </p>
          
          {candidateProfile?.resumeAnalysis ? (
            <div className="flex justify-center gap-4">
              <button
                onClick={() => router.push('/protected/candidate/roadmap/generator')}
                className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Generate Career Roadmap
              </button>
            </div>
          ) : (
            <div>
              <p className="text-orange-600 mb-4">
                Please upload your resume first to generate a career path.
              </p>
              <button
                onClick={() => router.push('/protected/candidate/profile')}
                className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Complete Your Profile
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-light text-gray-900">Career Roadmap</h1>
          <p className="text-sm text-gray-600 mt-1">Progress through levels to advance your career</p>
          {userProgress && (
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
                <span className="font-medium text-gray-900">Level {userProgress.currentLevel}</span>
              </div>
              <div className="text-sm text-gray-500">
                {userProgress.completedMilestones.length} milestones completed
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                viewMode === 'cards' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                viewMode === 'tree' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'
              }`}
            >
              Skill Tree
            </button>
          </div>
          <button
            onClick={() => router.push('/protected/candidate/roadmap/generator')}
            className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Generate New Path
          </button>
        </div>
      </div>
      
      {roadmap && userProgress && (
        <div>
          {/* Level Navigation */}
          <LevelNavigator
            currentLevel={selectedLevel}
            maxUnlockedLevel={userProgress.currentLevel + 1}
            levelData={generateLevelData(roadmap.milestones, userProgress)}
            onLevelSelect={setSelectedLevel}
            className="mb-8"
          />
          
          {viewMode === 'tree' ? (
            /* Skill Tree View */
            <SkillTreeView 
              milestones={roadmap.milestones}
              userProgress={userProgress}
              onMilestoneSelect={(milestone) => {
                setSelectedLevel(milestone.level || 1);
                setViewMode('cards');
              }}
            />
          ) : (
            /* Level-based Milestone Cards */
            <div>
              <div className="bg-white p-6 rounded-lg mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-800">
                    Level {selectedLevel} - {getLevelTitle(selectedLevel)}
                  </h2>
                  {/* Skip Level Button */}
                  {selectedLevel < Math.max(...roadmap.milestones.map(m => m.level || 1)) && 
                   selectedLevel <= (userProgress.maxUnlockedLevel || 1) &&
                   roadmap.milestones.filter(m => m.completed && (m.level || 1) === selectedLevel).length < 
                   roadmap.milestones.filter(m => (m.level || 1) === selectedLevel).length && (
                    <button
                      onClick={handleSkipLevel}
                      className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 flex items-center gap-2"
                      title="Skip this level and unlock the next one"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                      Skip Level
                    </button>
                  )}
                </div>
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-4 mr-4 overflow-hidden">
                    <div
                      className="bg-gray-900 h-4 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.round(
                          (roadmap.milestones.filter(m => m.completed && (m.level || 1) === selectedLevel).length / 
                           roadmap.milestones.filter(m => (m.level || 1) === selectedLevel).length || 1) * 100
                        )}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-gray-700 font-semibold whitespace-nowrap">
                    {roadmap.milestones.filter(m => m.completed && (m.level || 1) === selectedLevel).length} of{' '}
                    {roadmap.milestones.filter(m => (m.level || 1) === selectedLevel).length} completed
                  </span>
                </div>
              </div>
              
              {/* Level Milestones */}
              <LazyMilestoneList
                milestones={roadmap.milestones.filter(m => (m.level || 1) === selectedLevel)}
                userProgress={userProgress}
                onMilestoneComplete={handleMilestoneComplete}
                onMicroComplete={handleMicroMilestoneComplete}
              />
              
              {roadmap.milestones.filter(m => (m.level || 1) === selectedLevel).length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No milestones at this level</h3>
                  <p className="text-gray-600">Complete previous levels to unlock new content.</p>
                </div>
              )}
              
              {/* Generate Next Level Button */}
              {selectedLevel === Math.max(...roadmap.milestones.map(m => m.level || 1)) && (
                <div className="mt-8 text-center p-6 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Ready for the Next Challenge?</h3>
                  <button
                    onClick={handleGenerateNextLevel}
                    disabled={generatingNextLevel}
                    className={`px-8 py-4 rounded-lg font-medium text-white transition-all duration-300 ${
                      generatingNextLevel 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gray-900 hover:bg-gray-800'
                    }`}
                  >
                    {generatingNextLevel ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Generating Level {selectedLevel + 1}...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Generate Level {selectedLevel + 1}
                      </span>
                    )}
                  </button>
                  <p className="text-sm text-gray-600 mt-2">
                    Ready for more challenges? Generate the next level of your career path!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}