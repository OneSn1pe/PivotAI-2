'use client';

import React, { useEffect, useState } from 'react';
import { getDocs, collection, query, where, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, storage } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { CareerRoadmap, CandidateProfile } from '@/types/user';
import { useRouter } from 'next/navigation';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { useFileDownload } from '@/hooks/useFileDownload';
import ResumeManager from '@/components/candidate/ResumeManager';
import StatHexagon from '@/components/candidate/StatHexagon';
import CharacterStats from '@/components/ui/CharacterStats';
import QuestCard from '@/components/ui/QuestCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function CandidateDashboard() {
  const { userProfile } = useAuth();
  const candidateProfile = userProfile as CandidateProfile | null;
  const router = useRouter();
  const { downloadAndSaveFile, downloading } = useFileDownload();
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [showResumeManager, setShowResumeManager] = useState(false);
  const [validatedResumeUrl, setValidatedResumeUrl] = useState<string | null>(null);
  const [validatingUrl, setValidatingUrl] = useState(false);
  const [displayFileName, setDisplayFileName] = useState<string | null>(candidateProfile?.resumeFileName || null);
  const [careerLevel, setCareerLevel] = useState(1);
  const [careerPoints, setCareerPoints] = useState(0);
  const [nextLevelPoints, setNextLevelPoints] = useState(100);
  const [characterAttributes, setCharacterAttributes] = useState({
    intelligence: 55,
    charisma: 65,
    strength: 70,
    dexterity: 60,
    wisdom: 50,
    constitution: 75
  });

  // Mock character class - in a real implementation this would come from user profile
  const [characterClass] = useState('Tech Wizard');

  // Convert roadmap milestones to quests
  const [quests, setQuests] = useState<Array<any>>([]);

  useEffect(() => {
    async function fetchRoadmap() {
      if (!candidateProfile) return;
      
      try {
        const roadmapQuery = query(
          collection(db, 'roadmaps'),
          where('candidateId', '==', candidateProfile.uid)
        );
        
        const roadmapSnapshot = await getDocs(roadmapQuery);
        
        if (!roadmapSnapshot.empty) {
          const roadmapData = roadmapSnapshot.docs[0].data() as CareerRoadmap;
          setRoadmap(roadmapData);
          
          // Calculate career points based on completed milestones
          if (roadmapData.milestones) {
            const completedMilestones = roadmapData.milestones.filter(m => m.completed).length;
            const points = completedMilestones * 25;
            setCareerPoints(points);
            
            // Calculate level based on points (1 level per 100 points)
            const level = Math.max(1, Math.floor(points / 100) + 1);
            setCareerLevel(level);
            setNextLevelPoints((level) * 100);

            // Convert milestones to quests
            const convertedQuests = roadmapData.milestones.map((milestone, index) => ({
              id: `milestone-${index}`,
              title: milestone.title,
              description: milestone.description,
              type: index === 0 ? 'main' : 'side',
              difficulty: Math.min(5, Math.max(1, Math.ceil(index / 2) + 1)) as 1 | 2 | 3 | 4 | 5,
              status: milestone.completed ? 'completed' : 'available',
              rewards: {
                xp: 25,
                coins: 10
              },
              objectives: milestone.tasks ? milestone.tasks.map((task, taskIndex: number) => ({
                id: `task-${index}-${taskIndex}`,
                description: task.description,
                completed: task.completed
              })) : []
            }));
            
            setQuests(convertedQuests);
          }
        }
        
        // Set mock intelligence based on skills count if available
        if (candidateProfile.resumeAnalysis?.skills) {
          const skillCount = candidateProfile.resumeAnalysis.skills.length;
          const calculatedIntelligence = Math.min(95, Math.max(40, skillCount * 5));
          
          setCharacterAttributes(prev => ({
            ...prev,
            intelligence: calculatedIntelligence
          }));
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching roadmap:', error);
        setLoading(false);
      }
    }
    
    fetchRoadmap();
  }, [candidateProfile]);

  useEffect(() => {
    // Validate resume URL when candidate profile changes
    if (candidateProfile?.resumeUrl) {
      validateResumeUrl();
    }
  }, [candidateProfile?.resumeUrl]);

  useEffect(() => {
    if (candidateProfile?.resumeFileName) {
      setDisplayFileName(candidateProfile.resumeFileName);
    }
  }, [candidateProfile?.resumeFileName]);

  const handleResumeUpdate = () => {
    // Refresh dashboard data after resume update
    if (candidateProfile) {
      // Clear validated URL cache to force re-fetching
      setValidatedResumeUrl(null);
      
      // Get the latest filename from user document
      const fetchLatestData = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', candidateProfile.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Update local display filename immediately
            if (userData.resumeFileName) {
              setDisplayFileName(userData.resumeFileName);
            }
          }
        } catch (err) {
          console.error('Error fetching latest user data:', err);
        }
      };
      
      fetchLatestData();
      
      // Force revalidation to get the newest file
      setTimeout(() => {
        forceRevalidateResume();
      }, 1000); // Small delay to ensure Firebase consistency
      
      // Re-fetch data or reset state to ensure refreshed data is displayed
      router.refresh();
    }
  };

  // Function to validate resume URL
  const validateResumeUrl = async () => {
    if (!candidateProfile?.resumeUrl) return;
    
    setValidatingUrl(true);
    
    try {
      // Instead of using fetch (which can trigger CORS issues), 
      // we'll directly check if URL pattern matches a Firebase Storage URL
      const isStorageUrl = candidateProfile.resumeUrl.includes('firebasestorage.googleapis.com');
      
      if (isStorageUrl) {
        // For Firebase URLs, we'll trust it's valid since we just got it from Firebase
        setValidatedResumeUrl(candidateProfile.resumeUrl || null);
      } else {
        // For non-Firebase URLs, we can try fetch
        try {
          const response = await fetch(candidateProfile.resumeUrl, { method: 'HEAD' });
          if (response.ok) {
            setValidatedResumeUrl(candidateProfile.resumeUrl || null);
          } else {
            throw new Error('URL not accessible');
          }
        } catch (fetchErr) {
          throw new Error('URL validation failed');
        }
      }
    } catch (err) {
      console.error('Resume URL validation error:', err);
      
      // Try to recover by finding the most recent file
      try {
        if (!candidateProfile.uid) throw new Error('User not authenticated');
        
        const userResumesRef = ref(storage, `resumes/${candidateProfile.uid}`);
        
        // List all files in the user's resume directory
        const filesList = await listAll(userResumesRef);
        
        if (filesList.items.length === 0) {
          throw new Error('No resume files found in storage');
        }
        
        // Sort by name to get the most recent one (since we use timestamps in filenames)
        const sortedItems = [...filesList.items].sort((a, b) => {
          return b.name.localeCompare(a.name);
        });
        
        // Get the download URL of the most recent file
        const latestFileUrl = await getDownloadURL(sortedItems[0]);
        
        // Update the database with the correct URL
        await updateDoc(doc(db, 'users', candidateProfile.uid), {
          resumeUrl: latestFileUrl,
        });
        
        console.log('Updated resume URL in database to match most recent file');
        setValidatedResumeUrl(latestFileUrl);
      } catch (storageErr) {
        console.error('Storage recovery error:', storageErr);
        setValidatedResumeUrl(null);
      }
    } finally {
      setValidatingUrl(false);
    }
  };

  // Function to handle resume viewing/downloading
  const handleViewResume = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    // Force revalidation to ensure we're using the latest resume URL
    await forceRevalidateResume();
    
    if (validatingUrl) {
      console.log('Please wait, validating resume access...');
      return;
    }
    
    if (!validatedResumeUrl) {
      // Try to validate again
      console.error('Cannot access resume file. Trying to locate it...');
      return;
    }
    
    try {
      // Extract file path from the validatedResumeUrl
      if (!candidateProfile?.uid) {
        throw new Error('User not authenticated');
      }
      
      // Determine path and filename based on available information
      let resumePath = '';
      let filename = 'resume';
      
      // Check if we have a stored filename first
      if (candidateProfile.resumeFileName) {
        filename = candidateProfile.resumeFileName;
      }
      
      // Find the most recent file directly from storage
      const userResumesRef = ref(storage, `resumes/${candidateProfile.uid}`);
      const filesList = await listAll(userResumesRef);
      
      if (filesList.items.length === 0) {
        throw new Error('No resume files found in storage');
      }
      
      // Sort by name to get the most recent one (timestamps in names)
      const sortedItems = [...filesList.items].sort((a, b) => {
        return b.name.localeCompare(a.name);
      });
      
      resumePath = sortedItems[0].fullPath;
      
      // Use the file download hook with the most recent file's path
      await downloadAndSaveFile(resumePath, filename);
      
    } catch (err) {
      console.error('Resume download error:', err);
      
      // Fallback: open in a new tab if all else fails
      window.open(validatedResumeUrl, '_blank');
    }
  };

  // Force revalidation of resume reference to get the latest file
  const forceRevalidateResume = async () => {
    if (!candidateProfile?.uid) return;
    
    setValidatingUrl(true);
    
    try {
      // Get the user's resume directory
      const userResumesRef = ref(storage, `resumes/${candidateProfile.uid}`);
      
      // List all files in the user's resume directory
      const filesList = await listAll(userResumesRef);
      
      if (filesList.items.length === 0) {
        throw new Error('No resume files found in storage');
      }
      
      // Sort by name to get the most recent one (since we use timestamps in filenames)
      const sortedItems = [...filesList.items].sort((a, b) => {
        return b.name.localeCompare(a.name);
      });
      
      // Get the download URL of the most recent file
      const latestFileUrl = await getDownloadURL(sortedItems[0]);
      
      // Update the database with the correct URL if needed
      if (candidateProfile.resumeUrl !== latestFileUrl) {
        await updateDoc(doc(db, 'users', candidateProfile.uid), {
          resumeUrl: latestFileUrl,
        });
        
        console.log('Updated resume URL in database to match most recent file');
      }
      
      setValidatedResumeUrl(latestFileUrl);
    } catch (err) {
      console.error('Force revalidation error:', err);
      setValidatedResumeUrl(null);
    } finally {
      setValidatingUrl(false);
    }
  };

  const handleQuestClick = (questId: string) => {
    console.log(`Quest ${questId} clicked`);
    // In a real app, this would navigate to the quest details page
    // or open a modal with quest information
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner message="Loading guild data" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto pt-24">
      <div className="flex flex-col md:flex-row justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-slate-800">
            Guild Hall of {candidateProfile?.displayName || 'Adventurer'}
          </h1>
          <div className="text-purple-600 font-medium">
            {characterClass} • Career Adventurer
          </div>
        </div>
      </div>
      
      {!candidateProfile?.resumeUrl && (
        <div className="quest-card mb-6">
          <p className="text-amber-700 mb-2 flex items-center">
            <span className="mr-2 text-lg">⚠️</span>
            No character scroll detected! Upload your career scroll (resume) to unlock guild quests.
          </p>
          <button
            onClick={() => router.push('/protected/candidate/profile')}
            className="mt-1 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white py-2 px-4 rounded-md font-medium shadow-md shadow-purple-500/30 transition-all duration-300 quest-btn"
          >
            Create Scroll
          </button>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Character Stats Panel */}
        <div className="md:col-span-1">
          <CharacterStats 
            level={careerLevel}
            xp={careerPoints}
            nextLevelXp={nextLevelPoints}
            attributes={characterAttributes}
            className="mb-6"
          />
          
          {/* Inventory/Skills */}
          <div className="medieval-card p-4 mb-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Skill Inventory</h2>
            
            {candidateProfile?.resumeAnalysis?.skills ? (
              candidateProfile.resumeAnalysis.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {candidateProfile.resumeAnalysis.skills.map((skill, index) => (
                    <span 
                      key={index}
                      className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="py-3">
                  <p className="text-slate-600 text-sm">
                    No skills found in your scroll. You need to list your magical abilities to gain reputation with the guilds.
                  </p>
                  <button
                    onClick={() => setShowResumeManager(true)}
                    className="mt-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-md shadow-amber-500/30 transition-all duration-300 quest-btn"
                  >
                    Update Scroll
                  </button>
                </div>
              )
            ) : (
              <p className="text-slate-500 italic text-sm">Upload your scroll to reveal skills</p>
            )}
          </div>
          
          {/* Achievements */}
          <div className="medieval-card p-4">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Achievements</h2>
            <div className="grid grid-cols-3 gap-2">
              {candidateProfile?.resumeUrl && (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white">
                    📜
                  </div>
                  <span className="text-xs mt-1 text-center">Scroll Master</span>
                </div>
              )}
              
              {roadmap && roadmap.milestones.some(m => m.completed) && (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white">
                    🏆
                  </div>
                  <span className="text-xs mt-1 text-center">Quest Completer</span>
                </div>
              )}
              
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center text-white opacity-50">
                  🔮
                </div>
                <span className="text-xs mt-1 text-center text-gray-500">Locked</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quests Panel */}
        <div className="md:col-span-2">
          <div className="parchment p-4 mb-6">
            <h2 className="text-xl font-bold text-amber-800 mb-4">Quest Journal</h2>
            
            {showResumeManager ? (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-amber-700">Scroll Management</h3>
                  <button
                    onClick={() => setShowResumeManager(false)}
                    className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                  >
                    Return to Quests
                  </button>
                </div>
                <ResumeManager onUpdateComplete={handleResumeUpdate} />
              </div>
            ) : (
              <>
                {candidateProfile?.resumeUrl && (
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-amber-200">
                    <div className="flex items-center">
                      <div className="mr-3 text-2xl">📜</div>
                      <div>
                        <div className="font-medium text-amber-800">Career Scroll</div>
                        {displayFileName && (
                          <div className="text-xs text-amber-600">{displayFileName}</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <a 
                        href="#"
                        onClick={handleViewResume}
                        className={`text-blue-600 hover:text-blue-800 text-sm mr-3 ${validatingUrl || downloading ? 'opacity-50 cursor-wait' : ''}`}
                        aria-disabled={validatingUrl || downloading}
                      >
                        {validatingUrl ? 'Invoking...' : 
                         downloading ? 'Summoning...' : 'View Scroll'}
                      </a>
                      <button
                        onClick={() => setShowResumeManager(true)}
                        className="text-purple-600 hover:text-purple-800 text-sm"
                      >
                        Update Scroll
                      </button>
                    </div>
                  </div>
                )}
              
                {quests.length > 0 ? (
                  <div className="space-y-4">
                    {quests.map((quest) => (
                      <QuestCard 
                        key={quest.id}
                        {...quest}
                        onClick={handleQuestClick}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🗺️</div>
                    <h3 className="text-lg font-semibold text-amber-800 mb-2">No Quests Available</h3>
                    <p className="text-amber-700 mb-4">Visit the Career Map to discover new quests and adventures.</p>
                    <button 
                      onClick={() => router.push('/protected/candidate/roadmap')}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-6 py-2 rounded-md text-sm font-medium shadow-md shadow-amber-500/30 transition-all duration-300 quest-btn"
                    >
                      Explore Map
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Daily Quests */}
          <div className="medieval-card p-4">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Daily Quests</h2>
            <div className="space-y-3">
              <QuestCard 
                id="daily-1"
                title="Update Your Skill List"
                description="Review and update your skills to maintain an accurate character sheet."
                type="daily"
                difficulty={1}
                status="available"
                rewards={{
                  xp: 10,
                  coins: 5
                }}
                onClick={handleQuestClick}
              />
              
              <QuestCard 
                id="daily-2"
                title="Network with Guild Members"
                description="Connect with at least one new professional in your field today."
                type="daily"
                difficulty={2}
                status="available"
                rewards={{
                  xp: 15,
                  coins: 10
                }}
                onClick={handleQuestClick}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}