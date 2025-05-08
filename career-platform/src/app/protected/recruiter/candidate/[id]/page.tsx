'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { CandidateProfile, CareerRoadmap, RecruiterProfile } from '@/types/user';
import CareerRoadmapComponent from '@/components/candidate/CareerRoadmap';
import { initDebug, logComponent, logAuth, logCookies } from '@/utils/debugUtils';

// Debug logger for easier tracking
const debug = {
  log: (...args: any[]) => console.log('[CandidateDetailPage]', ...args),
  error: (...args: any[]) => console.error('[CandidateDetailPage]', ...args),
  warn: (...args: any[]) => console.warn('[CandidateDetailPage]', ...args),
  info: (...args: any[]) => console.info('[CandidateDetailPage]', ...args),
};

export default function CandidateDetailPage() {
  debug.log('Component rendering started');
  
  // Initialize debug utilities with a slight delay to ensure params are loaded
  useEffect(() => {
    setTimeout(() => {
      initDebug('CandidateDetailPage');
      
      // Check for navigation info in sessionStorage
      try {
        const lastNav = sessionStorage.getItem('lastNavigation');
        if (lastNav) {
          logComponent('CandidateDetailPage', 'Found navigation data in sessionStorage', JSON.parse(lastNav));
        }
      } catch (e) {
        debug.error('Error reading sessionStorage', e);
      }
    }, 50);
  }, []);
  
  const { userProfile, loading: authLoading, currentUser } = useAuth();
  const recruiterProfile = userProfile as RecruiterProfile | null;
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const candidateId = params.id as string;
  const navigationSource = searchParams.get('from');
  
  // Log the initial state
  debug.info('Initial render', { 
    candidateId, 
    authLoading, 
    hasUserProfile: !!userProfile, 
    hasCurrentUser: !!currentUser,
    navigationSource,
    userRole: userProfile?.role
  });
  
  const [candidate, setCandidate] = useState<CandidateProfile | null>(null);
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [componentMounted, setComponentMounted] = useState(false);
  const [authRetryCount, setAuthRetryCount] = useState(0);
  
  // Add an effect to check the authentication state on mount
  useEffect(() => {
    debug.log('Component mounted');
    setComponentMounted(true);
    
    // Check authentication cookies for debugging
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    logCookies('Authentication cookies on component mount');
    
    debug.info('Authentication state on mount', { 
      cookies: Object.keys(cookies),
      hasSessionCookie: 'session' in cookies,
      authLoading, 
      hasUserProfile: !!userProfile
    });
    
    // If we have navigation source but no auth yet, we might need to retry
    if (navigationSource && authLoading && !userProfile && authRetryCount < 3) {
      debug.warn('Auth not ready yet, but we have navigation source - will retry', {
        navigationSource,
        authRetryCount
      });
      
      // Set a timeout to increment retry counter
      const timeoutId = setTimeout(() => {
        setAuthRetryCount(prev => prev + 1);
        logAuth('Auth retry triggered', { attempt: authRetryCount + 1 });
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
    
    // Cleanup function
    return () => {
      debug.log('Component will unmount');
    };
  }, [navigationSource, authLoading, userProfile, authRetryCount]);
  
  useEffect(() => {
    // Log whenever auth state changes
    logAuth('Auth state changed', {
      authLoading,
      hasUserProfile: !!userProfile,
      hasCurrentUser: !!currentUser,
      userRole: userProfile?.role,
      retryCount: authRetryCount
    });
  }, [authLoading, userProfile, currentUser, authRetryCount]);
  
  useEffect(() => {
    // Ensure we have a candidateId and the recruiter is authenticated
    if (!candidateId) {
      debug.error('No candidate ID provided');
      setError('Candidate ID not provided');
      setLoading(false);
      return;
    }
    
    // Special handling for navigation from interested page
    if (navigationSource === 'interested' && !recruiterProfile && !authLoading) {
      debug.warn('Navigation from interested page but no recruiter profile yet', {
        hasSessionStorage: typeof sessionStorage !== 'undefined',
        retryCount: authRetryCount
      });
      
      // Check if we have navigation info in sessionStorage
      try {
        const lastNav = sessionStorage.getItem('lastNavigation');
        if (lastNav) {
          const navData = JSON.parse(lastNav);
          logComponent('CandidateDetailPage', 'Using navigation data to diagnose issues', navData);
          
          if (navData.hasToken && authRetryCount < 2) {
            // We had a token during navigation but auth hasn't loaded yet
            // Let's wait for auth to load by returning early
            debug.info('Token existed during navigation, waiting for auth to catch up');
            return;
          }
        }
      } catch (e) {
        debug.error('Error processing sessionStorage data', e);
      }
    }
    
    if (authLoading && authRetryCount < 3) {
      debug.log('Auth is still loading, waiting...', { retryCount: authRetryCount });
      return; // Don't proceed until auth is done loading
    }
    
    if (!recruiterProfile) {
      debug.error('No recruiter profile available, auth state:', { 
        authLoading, 
        hasCurrentUser: !!currentUser,
        retryCount: authRetryCount
      });
      
      // If we've retried a few times and still no auth, show the error
      if (authRetryCount >= 3) {
        setError('Authentication required. You might need to log in again.');
        setLoading(false);
      }
      return;
    }
    
    logComponent('CandidateDetailPage', 'Starting candidate data fetch', { 
      candidateId, 
      recruiterCompany: recruiterProfile?.company 
    });
    
    async function fetchCandidateData() {
      try {
        // Add connection status check
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          debug.error('Network connection unavailable');
          setError('Network connection unavailable. Please check your internet connection.');
          setLoading(false);
          return;
        }
        
        setLoading(true);
        debug.log('Fetching candidate profile...');
        
        // Fetch candidate profile
        const candidateDocRef = doc(db, 'users', candidateId);
        
        try {
          const candidateDocSnap = await getDoc(candidateDocRef);
          
          if (!candidateDocSnap.exists()) {
            debug.error('Candidate not found in Firestore');
            setError('Candidate not found');
            setLoading(false);
            return;
          }
          
          const candidateData = candidateDocSnap.data() as CandidateProfile;
          debug.info('Candidate data fetched successfully', { 
            candidateName: candidateData.displayName,
            hasSkills: !!candidateData.skills,
            hasResumeAnalysis: !!candidateData.resumeAnalysis,
            hasTargetCompanies: !!candidateData.targetCompanies,
          });
          
          logComponent('CandidateDetailPage', 'Candidate data loaded', {
            name: candidateData.displayName,
            uid: candidateData.uid
          });
          
          setCandidate(candidateData);
          
          // Set loading to false after getting basic profile
          setLoading(false);
          
          // Set roadmap loading separately
          setRoadmapLoading(true);
          debug.log('Fetching roadmap data...');
          
          // Fetch candidate's roadmap
          try {
            const roadmapQuery = query(
              collection(db, 'roadmaps'),
              where('candidateId', '==', candidateId)
            );
            
            const roadmapSnapshot = await getDocs(roadmapQuery);
            
            if (!roadmapSnapshot.empty) {
              const roadmapDoc = roadmapSnapshot.docs[0];
              const roadmapData = roadmapDoc.data();
              debug.log('Roadmap data found');
              
              // Ensure the milestones are properly converted for display
              const formattedMilestones = roadmapData.milestones.map((milestone: any) => ({
                ...milestone,
                id: milestone.id || `milestone-${Math.random().toString(36).substr(2, 9)}`,
                // Ensure created timestamps are converted to dates if needed
                createdAt: milestone.createdAt instanceof Date ? 
                          milestone.createdAt : 
                          (milestone.createdAt?.toDate ? milestone.createdAt.toDate() : new Date())
              }));
              
              setRoadmap({
                ...roadmapData,
                id: roadmapDoc.id,
                candidateId: candidateId,
                milestones: formattedMilestones,
                // Convert any Firebase timestamps to JS Dates
                createdAt: roadmapData.createdAt?.toDate?.() || new Date(),
                updatedAt: roadmapData.updatedAt?.toDate?.() || new Date()
              });
            } else {
              debug.log('No roadmap found for candidate');
            }
          } catch (roadmapError: any) {
            // Handle roadmap errors gracefully - just log, don't break the whole page
            debug.error('Error fetching roadmap:', roadmapError);
            // We still have the candidate data, so don't set an error state
          } finally {
            setRoadmapLoading(false);
          }
        } catch (firestoreError: any) {
          // Handle Firestore errors specific to candidate data fetching
          debug.error('Firestore error fetching candidate data:', firestoreError);
          
          if (firestoreError.name === 'FirebaseError' && firestoreError.code === 'permission-denied') {
            setError('Permission denied when accessing candidate data. Please try again later.');
          } else if (firestoreError.message && firestoreError.message.includes('load failed')) {
            setError('Connection to database failed. This may be a CORS issue. Please try refreshing the page.');
          } else if (firestoreError.message && firestoreError.message.includes('network error')) {
            setError('Network error when connecting to database. Please check your internet connection.');
          } else if (firestoreError.message && firestoreError.message.includes('access control checks')) {
            setError('Connection to database blocked. This is a CORS issue. Try clearing your browser cache and refreshing.');
          } else {
            setError('Failed to load candidate information. Please try again later.');
          }
          
          setLoading(false);
          setRoadmapLoading(false);
        }
      } catch (err) {
        // Catch-all for any other errors
        console.error('Error fetching candidate data:', err);
        debug.error('Error during data fetching', err);
        
        // Provide a generic error message
        setError('An unexpected error occurred. Please try refreshing the page.');
        setLoading(false);
        setRoadmapLoading(false);
      }
    }
    
    fetchCandidateData();
  }, [candidateId, recruiterProfile, authLoading, currentUser, navigationSource, authRetryCount]);
  
  // Debug rendering state
  debug.log('Rendering with state', { 
    loading, 
    hasError: !!error, 
    hasCandidate: !!candidate,
    authLoading,
    componentMounted
  });
  
  if (authLoading) {
    debug.log('Rendering auth loading state');
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Authenticating...</p>
          <p className="text-sm text-gray-400 mt-2">Debug: Loading auth from {navigationSource || 'unknown'}</p>
        </div>
      </div>
    );
  }
  
  if (loading) {
    debug.log('Rendering data loading state');
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading candidate profile...</p>
          <p className="text-sm text-gray-400 mt-2">Debug: Loading from {navigationSource || 'unknown'}</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
          <h2 className="text-xl font-bold text-red-700 mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  if (!candidate) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg text-center">
          <h2 className="text-xl font-bold text-yellow-700 mb-2">Candidate Not Found</h2>
          <p className="text-yellow-600">The candidate you're looking for could not be found.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  // Check if the candidate has the recruiter's company as a target
  const isInterestedInCompany = candidate.targetCompanies?.some(company => {
    return typeof company === 'string' 
      ? company === recruiterProfile?.company 
      : company.name === recruiterProfile?.company;
  });
  
  // Get target position for the recruiter's company
  const targetPosition = candidate.targetCompanies?.find(company => {
    return typeof company === 'object' && company.name === recruiterProfile?.company;
  });
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold">{candidate.displayName}'s Profile</h1>
        </div>
      </div>
      
      {/* Career Roadmap Section - Now placed at the top */}
      <div className="mb-8 bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-blue-800">Career Roadmap</h2>
          {roadmap && (
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-2">Progress:</span>
              <div className="w-32 bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ 
                    width: `${Math.round(
                      (roadmap.milestones.filter(m => m.completed).length / roadmap.milestones.length) * 100
                    )}%` 
                  }}
                ></div>
              </div>
              <span className="ml-2 text-sm font-medium text-blue-700">
                {Math.round(
                  (roadmap.milestones.filter(m => m.completed).length / roadmap.milestones.length) * 100
                )}%
              </span>
            </div>
          )}
        </div>
        
        {roadmapLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Loading roadmap...</span>
          </div>
        ) : roadmap ? (
          <CareerRoadmapComponent 
            roadmap={roadmap} 
            isEditable={false} // Recruiters can view but not edit
          />
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-600 font-medium">
              No career roadmap available
            </p>
            <p className="text-gray-500 mt-2 max-w-md mx-auto">
              This candidate hasn't generated a career roadmap yet. Roadmaps help track professional development goals and milestones.
            </p>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Candidate Info - Adding sticky scroll */}
        <div className="lg:col-span-1 h-fit">
          <div className="sticky top-6 space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Candidate Information</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm text-gray-500">Name</h3>
                  <p className="font-medium">{candidate.displayName}</p>
                </div>
                
                <div>
                  <h3 className="text-sm text-gray-500">Email</h3>
                  <p className="font-medium">{candidate.email}</p>
                </div>
                
                {isInterestedInCompany && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-700">Interested in Your Company</h3>
                    {targetPosition && typeof targetPosition === 'object' && (
                      <p className="text-blue-800 font-medium mt-1">
                        Position: {targetPosition.position}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Skills Section */}
            {candidate.resumeAnalysis?.skills && candidate.resumeAnalysis.skills.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {candidate.resumeAnalysis.skills.map((skill, index) => (
                    <span 
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Experience Section */}
            {candidate.resumeAnalysis?.experience && candidate.resumeAnalysis.experience.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4">Experience</h2>
                <ul className="space-y-3 list-disc pl-5 max-h-60 overflow-y-auto">
                  {candidate.resumeAnalysis.experience.map((experience, index) => (
                    <li key={index} className="text-gray-700">{experience}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Strengths & Weaknesses Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {candidate.resumeAnalysis?.strengths && candidate.resumeAnalysis.strengths.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-bold mb-4">Strengths</h2>
                  <ul className="space-y-2 list-disc pl-5 max-h-40 overflow-y-auto">
                    {candidate.resumeAnalysis.strengths.map((strength, index) => (
                      <li key={index} className="text-gray-700">{strength}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {candidate.resumeAnalysis?.weaknesses && candidate.resumeAnalysis.weaknesses.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-bold mb-4">Areas to Improve</h2>
                  <ul className="space-y-2 list-disc pl-5 max-h-40 overflow-y-auto">
                    {candidate.resumeAnalysis.weaknesses.map((weakness, index) => (
                      <li key={index} className="text-gray-700">{weakness}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right column - Candidate Profile Data */}
        <div className="lg:col-span-2">
          {/* Recommendations Section */}
          {candidate.resumeAnalysis?.recommendations && candidate.resumeAnalysis.recommendations.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Recommended Next Steps</h2>
              <ul className="space-y-3 list-disc pl-5">
                {candidate.resumeAnalysis.recommendations.map((recommendation, index) => (
                  <li key={index} className="text-gray-700">{recommendation}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Job Preferences Section */}
          {candidate.jobPreferences && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Job Preferences</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {candidate.jobPreferences.roles && candidate.jobPreferences.roles.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Desired Roles</h3>
                    <div className="flex flex-wrap gap-2">
                      {candidate.jobPreferences.roles.map((role, index) => (
                        <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {candidate.jobPreferences.industries && candidate.jobPreferences.industries.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Preferred Industries</h3>
                    <div className="flex flex-wrap gap-2">
                      {candidate.jobPreferences.industries.map((industry, index) => (
                        <span key={index} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                          {industry}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Work Type</h3>
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm capitalize">
                    {candidate.jobPreferences.remotePreference}
                  </span>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Salary Expectation</h3>
                  <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                    ${candidate.jobPreferences.salaryExpectation.toLocaleString()}/year
                  </span>
                </div>
                
                {candidate.jobPreferences.locations && candidate.jobPreferences.locations.length > 0 && (
                  <div className="md:col-span-2">
                    <h3 className="font-medium text-gray-700 mb-2">Preferred Locations</h3>
                    <div className="flex flex-wrap gap-2">
                      {candidate.jobPreferences.locations.map((location, index) => (
                        <span key={index} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
                          {location}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Target Companies Section */}
          {candidate.targetCompanies && candidate.targetCompanies.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Target Companies</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {candidate.targetCompanies.map((company, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-lg border ${
                      typeof company === 'object' && company.name === recruiterProfile?.company
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <h3 className="font-medium text-lg">
                      {typeof company === 'string' ? company : company.name}
                    </h3>
                    {typeof company === 'object' && company.position && (
                      <p className="text-gray-600 mt-1">Position: {company.position}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 