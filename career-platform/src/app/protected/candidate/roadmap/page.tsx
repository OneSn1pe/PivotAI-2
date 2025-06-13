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
import { LeveledMilestoneCard } from '@/components/candidate/LeveledMilestoneCard';
import { generateNextLevel } from '@/services/openai';

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

  // Add CSS to ensure navbar matches exactly
  useEffect(() => {
    // Add a style tag to ensure navbar displays exactly as in other pages
    const style = document.createElement('style');
    style.textContent = `
      /* Reset any potential custom styling */
      nav {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        z-index: 50 !important;
        width: 100% !important;
        flex-direction: row !important;
        height: auto !important;
        background: linear-gradient(to right, var(--tw-gradient-stops)) !important;
        --tw-gradient-from: #134e4a !important;
        --tw-gradient-to: #0f766e !important;
        --tw-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
        --tw-shadow-colored: 0 4px 6px -1px var(--tw-shadow-color), 0 2px 4px -1px var(--tw-shadow-color) !important;
        box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow) !important;
        --tw-shadow-color: rgba(15, 118, 110, 0.2) !important;
      }

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
    loadUserProgress();
  }, [userProfile]);

  const loadUserProgress = async () => {
    if (!userProfile) return;
    
    try {
      // Mock data for development - replace with actual Firebase calls
      const mockProgress: UserProgress = {
        userId: userProfile.uid,
        currentLevel: 1,
        maxUnlockedLevel: 1,
        completedMilestones: [],
        completedMicroMilestones: [],
        achievements: [],
        streakDays: 0,
        lastActiveDate: new Date(),
        skillProficiencies: {}
      };
      
      setUserProgress(mockProgress);
      setSelectedLevel(mockProgress.currentLevel);
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
    await handleToggleMilestone(milestoneId, true);
    // TODO: Award XP and check for level up
  };

  const handleMicroMilestoneComplete = async (microId: string) => {
    // TODO: Mark micro-milestone as complete and award XP
    console.log('Micro-milestone completed:', microId);
  };

  const generateLevelData = (milestones: Milestone[], progress: UserProgress) => {
    const levels = Array.from(new Set(milestones.map(m => m.level || 1))).sort((a, b) => a - b);
    
    return levels.map(level => {
      const levelMilestones = milestones.filter(m => (m.level || 1) === level);
      const completedCount = levelMilestones.filter(m => progress.completedMilestones.includes(m.id)).length;
      
      return {
        level,
        isActive: level === selectedLevel,
        isUnlocked: level <= progress.currentLevel + 1,
        isCompleted: completedCount === levelMilestones.length,
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
        <h1 className="text-4xl font-bold mb-6 text-slate-800 font-inter">Career Path</h1>
        <div className="text-center py-12 bg-white rounded-lg shadow-card border border-slate-200">
          <h2 className="text-2xl font-bold mb-4 text-slate-800 font-inter">No Career Path Found</h2>
          <p className="text-slate-600 mb-6">
            You can generate a personalized career path based on your resume and professional goals.
          </p>
          
          {candidateProfile?.resumeAnalysis ? (
            <div className="flex justify-center gap-4">
              <button
                onClick={() => router.push('/protected/candidate/roadmap/generator')}
                className="bg-teal-700 hover:bg-teal-800 text-white px-6 py-3 rounded font-medium shadow-button hover:shadow-button-hover transition-all duration-300"
              >
                Generate Your Career Path
              </button>
            </div>
          ) : (
            <div>
              <p className="text-amber-700 mb-4">
                Please upload your resume first to generate a career path.
              </p>
              <button
                onClick={() => router.push('/protected/candidate/profile')}
                className="bg-teal-700 hover:bg-teal-800 text-white px-6 py-3 rounded font-medium shadow-button hover:shadow-button-hover transition-all duration-300"
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
          <h1 className="text-4xl font-bold text-slate-800 font-inter">Your Career Path</h1>
          {userProgress && (
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full">
                <span className="text-xl">⭐</span>
                <span className="font-bold text-blue-700">Level {userProgress.currentLevel}</span>
              </div>
              <div className="text-sm text-gray-600">
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
            className="bg-teal-700 hover:bg-teal-800 text-white px-6 py-3 rounded font-medium shadow-button hover:shadow-button-hover transition-all duration-300"
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
              <div className="bg-white p-6 rounded-lg shadow-card border border-slate-200 mb-8">
                <h2 className="text-xl font-bold mb-4 text-slate-800 font-inter">
                  Level {selectedLevel} - {getLevelTitle(selectedLevel)}
                </h2>
                <div className="flex items-center">
                  <div className="w-full bg-slate-100 rounded-full h-4 mr-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-teal-600 to-teal-500 h-4 rounded-full"
                      style={{ 
                        width: `${Math.round(
                          (roadmap.milestones.filter(m => m.completed && (m.level || 1) === selectedLevel).length / 
                           roadmap.milestones.filter(m => (m.level || 1) === selectedLevel).length || 1) * 100
                        )}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-teal-700 font-semibold whitespace-nowrap">
                    {roadmap.milestones.filter(m => m.completed && (m.level || 1) === selectedLevel).length} of{' '}
                    {roadmap.milestones.filter(m => (m.level || 1) === selectedLevel).length} completed
                  </span>
                </div>
              </div>
              
              {/* Level Milestones */}
              <div className="space-y-6">
                {roadmap.milestones
                  .filter(milestone => (milestone.level || 1) === selectedLevel)
                  .map(milestone => (
                    <LeveledMilestoneCard
                      key={milestone.id}
                      milestone={milestone}
                      userProgress={userProgress}
                      onComplete={handleMilestoneComplete}
                      onMicroComplete={handleMicroMilestoneComplete}
                      isLocked={(milestone.level || 1) > userProgress.currentLevel}
                    />
                  ))}
              </div>
              
              {roadmap.milestones.filter(m => (m.level || 1) === selectedLevel).length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg shadow-card border border-slate-200">
                  <h3 className="text-lg font-medium text-slate-800 mb-2">No milestones at this level</h3>
                  <p className="text-slate-600">Complete previous levels to unlock new content.</p>
                </div>
              )}
              
              {/* Generate Next Level Button */}
              {selectedLevel === Math.max(...roadmap.milestones.map(m => m.level || 1)) && (
                <div className="mt-8 text-center p-6 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg border border-teal-200">
                  <h3 className="text-lg font-semibold text-teal-800 mb-3">Ready for the Next Challenge?</h3>
                  <button
                    onClick={handleGenerateNextLevel}
                    disabled={generatingNextLevel}
                    className={`px-8 py-4 rounded-lg font-medium text-white transition-all duration-300 ${
                      generatingNextLevel 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-lg hover:shadow-xl'
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
                        <span>🚀</span>
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