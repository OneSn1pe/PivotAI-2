'use client';

import React, { useEffect, useState } from 'react';
import { getDocs, collection, query, where, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, storage } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { CareerRoadmap, CandidateProfile, Milestone, categorizeMilestone, migrateLegacyMilestone } from '@/types/user';
import { useRouter } from 'next/navigation';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { useFileDownload } from '@/hooks/useFileDownload';
import ResumeManager from '@/components/candidate/ResumeManager';
import ProfessionalAttributes from '@/components/candidate/ProfessionalAttributes';
import ObjectiveCard from '@/components/ui/ObjectiveCard';
import TaskManager from '@/components/candidate/TaskManager';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SetupChecklist from '@/components/candidate/SetupChecklist';

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
  const [validatedResumeUrl, setValidatedResumeUrl] = useState<string | null>(null);
  const [validatingUrl, setValidatingUrl] = useState(false);
  const [displayFileName, setDisplayFileName] = useState<string | null>(candidateProfile?.resumeFileName || null);
  
  // Convert roadmap milestones to objectives
  const [objectives, setObjectives] = useState<Array<any>>([]);

  useEffect(() => {
    fetchRoadmap();
    validateResumeUrl();
  }, [candidateProfile]);

  const validateResumeUrl = async () => {
    if (!candidateProfile?.resumeUrl) return;
    
    setValidatingUrl(true);
    
    try {
      // Try to get the download URL, which will validate if the file exists
      const url = await getDownloadURL(ref(storage, candidateProfile.resumeUrl));
      setValidatedResumeUrl(url);
    } catch (error) {
      console.error('Error validating resume URL:', error);
        setValidatedResumeUrl(null);
    } finally {
      setValidatingUrl(false);
    }
  };

  const fetchRoadmap = async () => {
    if (!userProfile) return;
    
    try {
      setLoading(true);
      
      const roadmapQuery = query(
        collection(db, 'roadmaps'),
        where('candidateId', '==', userProfile.uid)
      );
      
      const roadmapSnapshot = await getDocs(roadmapQuery);
      
      if (!roadmapSnapshot.empty) {
        const roadmapData = {
          ...roadmapSnapshot.docs[0].data() as CareerRoadmap,
          id: roadmapSnapshot.docs[0].id,
        };
        
        setRoadmap(roadmapData);
        
        // Convert milestones to UI objectives
        convertMilestonesToObjectives(roadmapData);
      }
    } catch (error) {
      console.error('Error fetching roadmap:', error);
    } finally {
      setLoading(false);
    }
  };

  const convertMilestonesToObjectives = (roadmapData: CareerRoadmap) => {
    if (!roadmapData.milestones) return;
    
    const convertedObjectives = roadmapData.milestones.map((milestone, index) => {
      // Process milestone to ensure it has proper categorization
      let processedMilestone: Milestone;
      
      // Check if milestone has new categorization or needs migration
      if ('category' in milestone && milestone.category) {
        // Already has new format
        processedMilestone = milestone as Milestone;
      } else {
        // Legacy format - migrate
        const legacyMilestone = {
          ...milestone,
          id: milestone.id || `milestone-${index}`,
          title: milestone.title || 'Untitled Milestone',
          description: milestone.description || 'No description provided',
          timeframe: milestone.timeframe || 'No timeframe specified',
          completed: !!milestone.completed,
          skills: Array.isArray(milestone.skills) ? milestone.skills : [],
          resources: Array.isArray(milestone.resources) ? milestone.resources : [],
          skillType: (milestone as any).skillType || 'technical',
          createdAt: milestone.createdAt || new Date()
        };

        processedMilestone = migrateLegacyMilestone(legacyMilestone);
      }

      // Get the milestone category
      const category = processedMilestone.category || categorizeMilestone(processedMilestone);
      
      // Create tasks from milestone resources and tasks
      const tasks = [];
      
      // Add resource tasks
      if (processedMilestone.resources?.length > 0) {
        processedMilestone.resources.forEach((resource, idx) => {
          tasks.push({
            id: `resource-task-${processedMilestone.id}-${idx}`,
            description: `Review ${resource.title}`,
            completed: false,
          });
        });
      }
      
             // Add milestone tasks if they exist
       if (processedMilestone.tasks && processedMilestone.tasks.length > 0) {
         tasks.push(...processedMilestone.tasks.map(task => ({
           id: task.id,
           description: task.description,
           completed: task.completed,
         })));
       }
      
      // Add skills as tasks if needed and no other tasks exist
      if (tasks.length === 0 && processedMilestone.skills && processedMilestone.skills.length > 0) {
        tasks.push({
          id: `skill-task-${processedMilestone.id}`,
          description: `Develop skills in: ${processedMilestone.skills.join(', ')}`,
          completed: false,
        });
      }
      
      return {
        id: processedMilestone.id,
        title: processedMilestone.title,
        description: processedMilestone.description,
        type: category, // Use the new four-category system
        category: category, // Adding an explicit category property for clarity
        status: processedMilestone.completed ? 'completed' : 'available',
        priority: processedMilestone.priority || 'medium',
        estimatedHours: processedMilestone.estimatedHours,
        rewards: {
          points: 100,
          resources: processedMilestone.resources?.map(resource => ({
            id: `resource-${resource.type}-${Math.random().toString(36).substring(2, 9)}`,
            name: resource.title,
            type: resource.type as any,
          })) || [],
        },
        tasks,
      };
    });
    
    // Sort objectives by category priority: technical, fundamental, niche, soft
    const categoryOrder = ['technical', 'fundamental', 'niche', 'soft'];
    const sortedObjectives = convertedObjectives.sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a.type);
      const bIndex = categoryOrder.indexOf(b.type);
      return aIndex - bIndex;
    });
    
    setObjectives(sortedObjectives);
  };

  const handleQuestClick = (objectiveId: string) => {
    console.log(`Clicked on objective: ${objectiveId}`);
    // Navigate to objective detail or open a modal
  };

  const handleResumeUpdate = (fileName: string) => {
    setDisplayFileName(fileName);
    
    // Reload the candidate profile to get the updated resume URL
    if (userProfile) {
      // Fetch updated user doc
      getDoc(doc(db, 'users', userProfile.uid)).then(docSnap => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          
          if (userData.resumeUrl) {
            // Update URL and refresh validation
            getDownloadURL(ref(storage, userData.resumeUrl))
              .then(url => {
                setValidatedResumeUrl(url);
              })
              .catch(error => {
                console.error('Error getting updated resume URL:', error);
              });
          }
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner message="Loading data" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome Section */}
      <div className="bg-white p-6 rounded-lg shadow-card border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
            <h1 className="text-3xl font-bold text-slate-800 font-inter">Welcome, {candidateProfile?.displayName || 'Professional'}</h1>
            <p className="text-slate-600 mt-2">
              Your career development hub. Track progress, complete objectives, and advance professionally.
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/protected/candidate/profile')}
              className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded font-medium shadow-button hover:shadow-button-hover transition-all duration-300"
            >
              {displayFileName ? 'Update Resume' : 'Upload Resume'}
            </button>
            <button
              onClick={() => router.push('/protected/candidate/profile?tab=target-companies')}
              className="bg-slate-100 hover:bg-slate-200 text-teal-700 border border-teal-300 px-4 py-2 rounded font-medium shadow-button hover:shadow-button-hover transition-all duration-300"
            >
              Target Companies
            </button>
          </div>
        </div>
        
        {/* Status information on resume */}
        {displayFileName && (
          <div className="mt-4 flex items-center text-sm text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-teal-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
            <span>Resume: <span className="font-medium">{displayFileName}</span></span>
          </div>
        )}
      </div>
      
      {/* Setup Checklist */}
      <SetupChecklist candidateProfile={candidateProfile} roadmap={roadmap} />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Professional Info */}
        <div className="md:col-span-1 space-y-6">
          {/* Professional Attributes Panel */}
          <ProfessionalAttributes resumeAnalysis={candidateProfile?.resumeAnalysis} />
          
          {/* Skills Panel */}
          <div className="bg-white p-5 rounded-lg shadow-card border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800 font-inter mb-4">Skill Inventory</h2>
          
            {candidateProfile?.resumeAnalysis?.skills && candidateProfile.resumeAnalysis.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {candidateProfile.resumeAnalysis.skills.map((skill, index) => (
                  <span key={index} className="bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-xs border border-slate-200">
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-slate-500 text-sm">No skills found in your resume</p>
                <button
                  onClick={() => router.push('/protected/candidate/profile')}
                  className="mt-2 text-teal-700 hover:text-teal-800 text-sm font-medium"
                >
                  Upload or update your resume
                </button>
              </div>
            )}
          </div>
          
          {/* Career Progress Panel */}
          <div className="bg-white p-5 rounded-lg shadow-card border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800 font-inter mb-4">Career Progress</h2>
            
            {roadmap ? (
              <div>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">Milestone Progress</span>
                    <span className="text-slate-700 font-medium">
                      {roadmap.milestones.filter(m => m.completed).length} / {roadmap.milestones.length}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-teal-500 to-teal-400 h-2"
                      style={{ width: `${(roadmap.milestones.filter(m => m.completed).length / roadmap.milestones.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <button
                  onClick={() => router.push('/protected/candidate/roadmap')}
                  className="w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded text-sm font-medium transition-all duration-300"
                >
                  View Full Career Path
                </button>
                </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-slate-500 text-sm mb-3">No career path created yet</p>
                <button
                  onClick={() => router.push('/protected/candidate/roadmap/generator')}
                  className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded text-sm font-medium shadow-button hover:shadow-button-hover transition-all duration-300"
                >
                  Create Career Path
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Task Manager */}
        <div className="md:col-span-2">
          {objectives.length > 0 ? (
            <TaskManager 
              objectives={objectives}
              onObjectiveClick={handleQuestClick}
            />
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-card border border-slate-200 text-center py-10">
              <div className="text-5xl mb-4">🧭</div>
              <h3 className="text-lg font-medium text-slate-800 mb-2">No Objectives Available</h3>
              <p className="text-slate-600 mb-6">
                Generate a career path to receive personalized professional objectives.
              </p>
              <button
                onClick={() => router.push('/protected/candidate/roadmap/generator')}
                className="bg-teal-700 hover:bg-teal-800 text-white px-6 py-3 rounded font-medium shadow-button hover:shadow-button-hover transition-all duration-300"
              >
                Generate Career Path
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}