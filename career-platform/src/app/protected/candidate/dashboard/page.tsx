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

// Define an extended milestone interface to handle tasks property
interface MilestoneWithTasks {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  tasks?: Array<{
    id?: string;
    description: string;
    completed: boolean;
  }>;
}

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
  
  // Character attributes remain as they're used for the stats display without leveling
  const [characterAttributes, setCharacterAttributes] = useState({
    intelligence: 55,
    charisma: 65,
    strength: 70,
    dexterity: 60,
    wisdom: 50,
    constitution: 75
  });

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
          
          // Convert milestones to quests without XP/level calculations
          if (roadmapData.milestones) {
            // Convert milestones to quests
            const convertedQuests = roadmapData.milestones.map((milestone, index) => {
              // Cast to extended interface to handle tasks property
              const milestoneWithTasks = milestone as unknown as MilestoneWithTasks;
              
              return {
                id: `milestone-${index}`,
                title: milestone.title,
                description: milestone.description,
                type: index === 0 ? 'main' : 'side',
                difficulty: Math.min(5, Math.max(1, Math.ceil(index / 2) + 1)) as 1 | 2 | 3 | 4 | 5,
                status: milestone.completed ? 'completed' : 'available',
                rewards: { xp: 0 }, // Required by QuestCard interface
                objectives: milestoneWithTasks.tasks ? milestoneWithTasks.tasks.map((task, taskIndex: number) => ({
                  id: `task-${index}-${taskIndex}`,
                  description: task.description,
                  completed: task.completed
                })) : []
              };
            });
            
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
        
        // Sort files by name (assuming they're timestamped) to get most recent one
        const sortedItems = [...filesList.items].sort((a, b) => {
          return b.name.localeCompare(a.name); // Reverse order (newest first)
        });
        
        // Get download URL for the most recent file
        const latestFileUrl = await getDownloadURL(sortedItems[0]);
        
        console.log('Recovered resume URL from storage:', latestFileUrl);
        setValidatedResumeUrl(latestFileUrl);
      } catch (recoveryErr) {
        console.error('Failed to recover resume URL:', recoveryErr);
        setValidatedResumeUrl(null);
      }
    } finally {
      setValidatingUrl(false);
    }
  };

  const handleViewResume = async () => {
    if (validatingUrl) return;
    
    if (!validatedResumeUrl) {
      console.error('No valid resume URL found');
      return;
    }
    
    try {
      if (!candidateProfile?.uid) throw new Error('User not authenticated');
      
      // Get all files in storage to find most recent
      const userResumesRef = ref(storage, `resumes/${candidateProfile.uid}`);
      const filesList = await listAll(userResumesRef);
      
      if (filesList.items.length === 0) {
        throw new Error('No resume files found in storage');
      }
      
      // Sort by name to get the most recent one
      const sortedItems = [...filesList.items].sort((a, b) => {
        return b.name.localeCompare(a.name);
      });
      
      // Use the most recent file's path directly
      const resumePath = sortedItems[0].fullPath;
      
      // Determine filename
      let filename = 'resume';
      if (candidateProfile.resumeFileName) {
        filename = candidateProfile.resumeFileName;
      } else {
        // Extract filename from path if available
        const pathParts = resumePath.split('/');
        filename = pathParts[pathParts.length - 1];
      }
      
      // Download the file
      await downloadAndSaveFile(resumePath, filename);
    } catch (err) {
      console.error('Error viewing resume:', err);
      
      // Fallback: open URL in new tab if available
      if (validatedResumeUrl) {
        window.open(validatedResumeUrl, '_blank');
      }
    }
  };

  const forceRevalidateResume = async () => {
    if (!candidateProfile?.resumeUrl) return;
    setValidatedResumeUrl(null);
    await validateResumeUrl();
  };

  const handleQuestClick = (questId: string) => {
    // Navigate to roadmap page when a quest is clicked
    router.push('/protected/candidate/roadmap');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner message="Loading guild data" />
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      {/* Welcome Section */}
      <div className="medieval-card p-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Welcome, {candidateProfile?.displayName || 'Adventurer'}</h1>
            <p className="text-slate-600 mt-2">
              Your career journey awaits. Complete quests and unlock your potential!
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowResumeManager(true)}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-md shadow-amber-500/30 transition-all duration-300 quest-btn"
            >
              {displayFileName ? 'Update Scroll' : 'Upload Scroll'}
            </button>
            
            {displayFileName && validatedResumeUrl && (
              <button
                onClick={() => handleViewResume()}
                className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-md shadow-sky-500/30 transition-all duration-300 quest-btn"
              >
                View Scroll
              </button>
            )}
          </div>
        </div>
        
        {/* Status information on resume */}
        {candidateProfile?.resumeFileName && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-center gap-2">
              <span className="text-amber-700 text-sm">Current Scroll:</span>
              <span className="text-slate-700 text-sm font-medium">{displayFileName}</span>
              
              {validatingUrl && (
                <span className="text-blue-600 text-xs">Checking scroll...</span>
              )}
              
              {!validatingUrl && !validatedResumeUrl && candidateProfile?.resumeUrl && (
                <button
                  onClick={forceRevalidateResume}
                  className="text-blue-600 hover:text-blue-800 text-xs underline"
                >
                  Revalidate link
                </button>
              )}
            </div>
            
            {candidateProfile?.resumeAnalysis && (
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  {candidateProfile.resumeAnalysis.skills?.length || 0} Skills
                </span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  {candidateProfile.resumeAnalysis.experience?.length || 0} Jobs
                </span>
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                  {candidateProfile.resumeAnalysis.education?.length || 0} Education
                </span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Resume Manager Modal */}
      {showResumeManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
            <ResumeManager
              onUpdateComplete={handleResumeUpdate}
            />
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Character Stats Panel */}
        <div className="md:col-span-1">
          <CharacterStats 
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
            
            {roadmap ? (
              roadmap.milestones.filter(m => m.completed).length > 0 ? (
                <div className="space-y-3">
                  {roadmap.milestones.filter(m => m.completed).map((milestone, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-3 p-2 bg-amber-50 border border-amber-200 rounded-md"
                    >
                      <div className="text-amber-600 text-xl">🏆</div>
                      <div>
                        <div className="font-medium text-slate-800">{milestone.title}</div>
                        <div className="text-xs text-slate-600">Completed milestone</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 italic text-sm">Complete quests to earn achievements</p>
              )
            ) : (
              <p className="text-slate-600 italic text-sm">Generate a roadmap to start collecting achievements</p>
            )}
          </div>
        </div>
        
        {/* Quests */}
        <div className="md:col-span-2">
          <div className="medieval-card p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Active Quests</h2>
            
            {quests.length > 0 ? (
              <div className="space-y-6">
                {quests.map((quest) => (
                  <QuestCard
                    key={quest.id}
                    id={quest.id}
                    title={quest.title}
                    description={quest.description}
                    type={quest.type}
                    difficulty={quest.difficulty}
                    status={quest.status}
                    rewards={quest.rewards}
                    objectives={quest.objectives}
                    onClick={() => handleQuestClick(quest.id)}
                  />
                ))}
              </div>
            ) : roadmap ? (
              <div className="text-center py-10">
                <div className="text-5xl mb-4">📜</div>
                <h3 className="text-lg font-medium text-slate-800 mb-2">No Active Quests</h3>
                <p className="text-slate-600 mb-6">
                  Your roadmap doesn't have any milestones yet.
                </p>
                <button 
                  onClick={() => router.push('/protected/candidate/roadmap/generator')}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-6 py-3 rounded-full font-medium shadow-md shadow-amber-500/30 transition-all duration-300 quest-btn"
                >
                  Generate New Roadmap
                </button>
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="text-5xl mb-4">🗺️</div>
                <h3 className="text-lg font-medium text-slate-800 mb-2">No Roadmap Found</h3>
                <p className="text-slate-600 mb-6">
                  Create a career roadmap to get personalized quests based on your goals.
                </p>
                <button 
                  onClick={() => router.push('/protected/candidate/roadmap/generator')}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-6 py-3 rounded-full font-medium shadow-md shadow-amber-500/30 transition-all duration-300 quest-btn"
                >
                  Create Career Roadmap
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}