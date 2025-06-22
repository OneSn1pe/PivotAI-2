'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { getDocs, collection, query, where, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, storage } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { CareerRoadmap, CandidateProfile, Milestone, categorizeMilestone, migrateLegacyMilestone, UserProgress, Achievement } from '@/types/user';
import { useRouter } from 'next/navigation';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { useFileDownload } from '@/hooks/useFileDownload';
import { Loading } from '@/components/ui/loading';
import { toast } from 'sonner';

// Lazy load heavy components
const ResumeManager = dynamic(() => import('@/components/candidate/ResumeManager'), {
  loading: () => <div className="h-20 bg-gray-100 animate-pulse rounded-lg" />,
  ssr: false
});

const SetupChecklist = dynamic(() => import('@/components/candidate/SetupChecklist'), {
  loading: () => <div className="h-32 bg-gray-100 animate-pulse rounded-lg" />,
  ssr: false
});

const ProgressDashboard = dynamic(() => 
  import('@/components/progress/ProgressDashboard').then(mod => ({ default: mod.ProgressDashboard })), {
  loading: () => <div className="h-48 bg-gray-100 animate-pulse rounded-lg" />,
  ssr: false
});


const AchievementShowcase = dynamic(() => 
  import('@/components/gamification/AchievementBadges').then(mod => ({ default: mod.AchievementShowcase })), {
  loading: () => <div className="h-24 bg-gray-100 animate-pulse rounded-lg" />,
  ssr: false
});

const QuickShareButton = dynamic(() => 
  import('@/components/social/AchievementShare').then(mod => ({ default: mod.QuickShareButton })), {
  loading: () => <div className="h-10 bg-gray-100 animate-pulse rounded-lg" />,
  ssr: false
});

const ActivityTracker = dynamic(() => 
  import('@/components/dashboard/ActivityTracker').then(mod => ({ default: mod.ActivityTracker })), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />,
  ssr: false
});

const MilestoneTracker = dynamic(() => 
  import('@/components/dashboard/MilestoneTracker').then(mod => ({ default: mod.MilestoneTracker })), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />,
  ssr: false
});


// Lazy load ProgressTrackingService
const loadProgressTrackingService = () => import('@/services/progressTracking').then(mod => mod.ProgressTrackingService);


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
  
  
  // Leveling system state
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    fetchRoadmap();
    validateResumeUrl();
    loadUserProgress();
  }, [candidateProfile]);

  const loadUserProgress = async () => {
    if (!userProfile) return;
    
    try {
      // Dynamically import ProgressTrackingService
      const ProgressTrackingService = await loadProgressTrackingService();
      
      // Load real user progress from Firebase
      const progress = await ProgressTrackingService.getUserProgress(userProfile.uid);
      setUserProgress(progress);
      
      // Update daily activity (login streak)
      const { streakDays } = await ProgressTrackingService.updateDailyActivity(userProfile.uid);
      
      // Load achievements
      const userAchievements = await ProgressTrackingService.getUserAchievements(userProfile.uid);
      setAchievements(userAchievements);
      
      // Get activity stats
      const stats = await ProgressTrackingService.getActivityStats(userProfile.uid);
      
      
      
      // Show daily login toast
      if (streakDays > 0) {
        toast.success(`Welcome back! ${streakDays} day streak!`);
      }
    } catch (error) {
      console.error('Error loading user progress:', error);
      
      // Fallback to default values if Firebase fails
      const defaultProgress: UserProgress = {
        userId: userProfile.uid,
        levelsUnlocked: 1,
        completedMilestones: [],
        completedMicroMilestones: [],
        achievements: [],
        streakDays: 0,
        lastActiveDate: new Date(),
        skillProficiencies: {}
      };
      setUserProgress(defaultProgress);
    }
  };

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
      }
    } catch (error) {
      console.error('Error fetching roadmap:', error);
    } finally {
      setLoading(false);
    }
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
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <Loading size="lg" />
        <p className="text-sm text-gray-600">Loading data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Section with Level Display */}
      <div className="bg-white p-6 rounded-lg">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {candidateProfile?.displayName || 'Professional'}</h1>
            <p className="text-gray-600">
              Your career development hub. Track progress, complete objectives, and advance professionally.
            </p>
            {userProgress && (
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="font-semibold">Level {userProgress.levelsUnlocked}</span>
                </div>
                <span className="text-sm text-gray-600">
                  {userProgress.completedMilestones.length} milestones completed
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/protected/candidate/profile')}
              className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {displayFileName ? 'Update Resume' : 'Upload Resume'}
            </button>
            <button
              onClick={() => router.push('/protected/candidate/profile?tab=target-companies')}
              className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Target Companies
            </button>
          </div>
        </div>
        
        {/* Status information on resume */}
        {displayFileName && (
          <div className="mt-4 flex items-center text-sm text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-500">Resume: <span className="text-gray-700">{displayFileName}</span></span>
          </div>
        )}
      </div>
      
      {/* Setup Checklist */}
      <SetupChecklist candidateProfile={candidateProfile} roadmap={roadmap} />
      
      {/* Progress Dashboard - Primary progress display */}
      {userProgress && achievements && (
        <ProgressDashboard 
          userProgress={userProgress} 
          achievements={achievements}
          className="mb-6"
        />
      )}
      
      {/* Achievement Showcase with Share Button */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Recent Achievements</h3>
          {achievements.length > 0 && userProgress && (
            <QuickShareButton 
              achievement={achievements[0]} 
              userProgress={userProgress}
              className=""
            />
          )}
        </div>
        <AchievementShowcase achievements={achievements} />
      </div>
      
      {/* Primary Activity and Milestone Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Tracker - Time-based statistics */}
        {userProfile && (
          <ActivityTracker userId={userProfile.uid} />
        )}
        {/* Milestone Tracker - Interactive milestone management */}
        {roadmap && userProgress && (
          <MilestoneTracker
            userId={userProfile?.uid || ''}
            milestones={roadmap.milestones || []}
            completedMilestones={userProgress.completedMilestones}
            onMilestoneComplete={(milestoneId) => {
              // Refresh user progress after milestone completion
              loadUserProgress();
            }}
          />
        )}
      </div>

    </div>
  );
}