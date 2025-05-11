'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { CandidateProfile, CareerRoadmap, RecruiterProfile } from '@/types/user';
import CareerRoadmapComponent from '@/components/candidate/CareerRoadmap';
import { UserRole } from '@/types/user';

// Add diagnostic logging helper
const diagnostics = {
  log: (message: string, data?: any) => {
    console.log(`[RECRUITER:CANDIDATE:DIAGNOSTICS] ${message}`, data || '');
  },
  error: (message: string, error: any) => {
    console.error(`[RECRUITER:CANDIDATE:ERROR] ${message}`, error);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[RECRUITER:CANDIDATE:WARNING] ${message}`, data || '');
  }
};

// Simple fallback roadmap component
const FallbackRoadmapComponent = ({ roadmap }: { roadmap: CareerRoadmap }) => {
  if (!roadmap || !roadmap.milestones) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700 font-medium">Error: Invalid roadmap data</p>
      </div>
    );
  }
  
  return (
    <div className="p-4 bg-white border border-blue-200 rounded-lg">
      <h3 className="text-xl font-bold mb-4 text-blue-800">Career Roadmap (Fallback View)</h3>
      <p className="mb-4 text-sm bg-yellow-50 p-2 rounded">
        This is a simplified view of the roadmap due to rendering issues with the main component.
      </p>
      
      <div className="space-y-6">
        {roadmap.milestones.map((milestone, index) => (
          <div 
            key={milestone.id || `milestone-${index}`} 
            className="p-4 bg-white shadow-sm border border-gray-200 rounded-lg"
          >
            <div className="flex justify-between items-start">
              <h4 className="text-lg font-bold text-gray-800">
                {index + 1}. {milestone.title || 'Untitled Milestone'}
              </h4>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                {milestone.timeframe || 'No timeframe'}
              </span>
            </div>
            
            <p className="my-2 text-gray-600">{milestone.description || 'No description provided'}</p>
            
            {milestone.skills && milestone.skills.length > 0 && (
              <div className="mt-3">
                <h5 className="text-sm font-semibold text-gray-700 mb-1">Skills to develop:</h5>
                <div className="flex flex-wrap gap-1">
                  {milestone.skills.map((skill, i) => (
                    <span key={i} className="bg-gray-100 text-gray-800 px-2 py-0.5 text-xs rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {milestone.completed && (
              <div className="mt-3 flex items-center text-green-600">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Completed</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Error boundary component
class RoadmapErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('[ROADMAP-ERROR-BOUNDARY] Error rendering roadmap:', error);
    console.error('[ROADMAP-ERROR-BOUNDARY] Error info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export default function CandidateDetailPage() {
  const { userProfile, currentUser } = useAuth();
  const recruiterProfile = userProfile as RecruiterProfile | null;
  const router = useRouter();
  const params = useParams();
  const candidateId = params.id as string;
  
  // Add detailed debug logging
  diagnostics.log(`Initializing page with candidateId=${candidateId}`, userProfile ? {
    uid: userProfile.uid,
    role: userProfile.role,
    displayName: userProfile.displayName,
    isRecruiter: userProfile.role === UserRole.RECRUITER
  } : 'null');
  
  if (recruiterProfile) {
    diagnostics.log('RecruiterProfile info', {
      company: recruiterProfile.company,
      position: recruiterProfile.position
    });
  }
  
  // Add state to toggle between regular and direct render
  const [useDirectRender, setUseDirectRender] = useState(false);
  
  // Diagnostics: Log environment
  useEffect(() => {
    diagnostics.log('Environment check', {
      isProd: process.env.NODE_ENV === 'production',
      isDev: process.env.NEXT_PUBLIC_DEVELOPMENT_MODE === 'true',
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
    });
    
    // Check session cookie
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      
      diagnostics.log('Auth tokens check', {
        sessionExists: !!cookies['session'],
        sessionLength: cookies['session']?.length || 0
      });
    }
    
    // Check for ID token
    if (currentUser) {
      currentUser.getIdToken()
        .then(token => {
          diagnostics.log('Firebase ID token retrieved', { length: token.length });
        })
        .catch(err => {
          diagnostics.error('Failed to get Firebase ID token', err);
        });
    } else {
      diagnostics.warn('No Firebase user found');
    }
  }, [currentUser]);
  
  // Add navigation debugging - prevent automatic redirection away from this page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      diagnostics.log('Page mounted, URL:', window.location.href);
      
      // Capture any navigation attempts
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        diagnostics.log('Navigation attempt detected');
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, []);
  
  const [candidate, setCandidate] = useState<CandidateProfile | null>(null);
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null);
  
  useEffect(() => {
    // Ensure we have a candidateId and the recruiter is authenticated
    if (!candidateId || !recruiterProfile) {
      const diagInfo = { 
        candidateId: !!candidateId, 
        recruiterProfile: !!recruiterProfile,
        userRole: userProfile?.role,
        isCurrentUserNull: !currentUser
      };
      
      diagnostics.error('Missing requirements:', diagInfo);
      setDiagnosticInfo(diagInfo);
      setError(!candidateId ? 'Candidate ID not provided' : 'Authentication required - not a recruiter profile');
      setLoading(false);
      return;
    }
    
    async function fetchCandidateData() {
      const diagInfo: Record<string, any> = {};
      
      try {
        setLoading(true);
        diagnostics.log(`Fetching candidate data for ID: ${candidateId}`);
        
        // First verify the token
        if (currentUser) {
          try {
            const token = await currentUser.getIdToken(true); // Force refresh
            diagInfo.tokenLength = token.length;
            diagnostics.log('Retrieved fresh ID token', { length: token.length });
            
            // Update session cookie with fresh token
            if (typeof document !== 'undefined') {
              const isLocalDevelopment = typeof window !== 'undefined' && 
                (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
              
              if (isLocalDevelopment) {
                document.cookie = `session=${token}; path=/; max-age=3600`;
              } else {
                document.cookie = `session=${token}; path=/; max-age=3600; secure; samesite=strict`;
              }
              diagnostics.log('Updated session cookie with fresh token');
            }
          } catch (tokenErr) {
            diagnostics.error('Error refreshing ID token', tokenErr);
            diagInfo.tokenError = tokenErr instanceof Error ? tokenErr.message : 'Unknown token error';
          }
        }
        
        // Fetch candidate profile
        const candidateDocRef = doc(db, 'users', candidateId);
        const candidateDocSnap = await getDoc(candidateDocRef)
          .catch(error => {
            diagnostics.error('Firebase error fetching candidate:', error);
            diagInfo.candidateProfileError = error instanceof Error ? error.message : 'Unknown error';
            diagInfo.candidateProfileErrorCode = error.code || 'No error code';
            
            if (error.code === 'permission-denied') {
              throw new Error('Permission denied: You do not have access to view this candidate profile.');
            }
            throw error;
          });
        
        diagInfo.candidateExists = candidateDocSnap.exists();
        
        if (!candidateDocSnap.exists()) {
          diagnostics.warn('Candidate not found');
          setError('Candidate not found');
          setLoading(false);
          return;
        }
        
        diagnostics.log('Successfully fetched candidate profile');
        const candidateData = candidateDocSnap.data() as CandidateProfile;
        diagInfo.candidateRole = candidateData.role;
        setCandidate(candidateData);
        
        // Set loading to false after getting basic profile
        setLoading(false);
        
        // Set roadmap loading separately
        setRoadmapLoading(true);
        
        // ENHANCED DIAGNOSTICS - Add verbose roadmap fetching logs
        diagnostics.log(`[ENHANCED] Starting roadmap fetch for candidate ID: ${candidateId}`);
        diagnostics.log(`[ENHANCED] Current environment: ${process.env.NODE_ENV}`);
        diagnostics.log(`[ENHANCED] User role from profile: ${userProfile?.role}`);
        
        // Fetch candidate's roadmap
        diagnostics.log(`Fetching roadmap for candidate ID: ${candidateId}`);
        const roadmapQuery = query(
          collection(db, 'roadmaps'),
          where('candidateId', '==', candidateId)
        );
        
        diagnostics.log('[ENHANCED] Running roadmap query...');
        
        let roadmapSnapshot;
        try {
          roadmapSnapshot = await getDocs(roadmapQuery);
          diagnostics.log(`[ENHANCED] Roadmap query executed. Empty: ${roadmapSnapshot.empty}. Size: ${roadmapSnapshot.size}`);
          diagInfo.roadmapFound = !roadmapSnapshot.empty;
          diagInfo.roadmapCount = roadmapSnapshot.size;
          
          if (roadmapSnapshot.empty) {
            diagnostics.log('[ENHANCED] No roadmap documents found for this candidate');
          } else {
            diagnostics.log(`[ENHANCED] Retrieved ${roadmapSnapshot.size} roadmap document(s)`);
          }
        } catch (error: any) {
          diagnostics.error('[ENHANCED] Firebase error fetching roadmap:', error);
          diagInfo.roadmapError = error instanceof Error ? error.message : 'Unknown error';
          diagInfo.roadmapErrorCode = error.code || 'No error code';
          
          if (error.code === 'permission-denied') {
            diagnostics.error('[ENHANCED] Permission denied error for roadmap query', error);
            throw new Error('Permission denied: You do not have access to view this roadmap.');
          }
          throw error;
        }
        
        if (!roadmapSnapshot.empty) {
          diagnostics.log('Successfully fetched roadmap data');
          const roadmapDoc = roadmapSnapshot.docs[0];
          const roadmapData = roadmapDoc.data();
          
          // Log the raw roadmap data structure
          diagnostics.log('[ENHANCED] Raw roadmap data keys:', Object.keys(roadmapData));
          diagnostics.log('[ENHANCED] Milestones array exists:', !!roadmapData.milestones);
          diagnostics.log('[ENHANCED] Milestones count:', roadmapData.milestones?.length || 0);
          
          diagInfo.roadmapDataSnapshot = {
            id: roadmapDoc.id,
            keys: Object.keys(roadmapData),
            hasMilestones: !!roadmapData.milestones,
            milestonesCount: roadmapData.milestones?.length || 0,
            milestonesType: roadmapData.milestones ? Array.isArray(roadmapData.milestones) ? 'array' : typeof roadmapData.milestones : 'undefined'
          };
          
          // Sample the first milestone data if available
          if (roadmapData.milestones && roadmapData.milestones.length > 0) {
            const firstMilestone = roadmapData.milestones[0];
            diagnostics.log('[ENHANCED] First milestone keys:', Object.keys(firstMilestone));
            diagInfo.firstMilestoneKeys = Object.keys(firstMilestone);
          }
          
          diagInfo.milestoneCount = roadmapData.milestones?.length || 0;
          
          // Ensure the milestones are properly converted for display
          diagnostics.log('[ENHANCED] Processing milestones for component rendering');
          let formattedMilestones;
          
          try {
            formattedMilestones = roadmapData.milestones.map((milestone: any, index: number) => {
              diagnostics.log(`[ENHANCED] Processing milestone ${index+1}/${roadmapData.milestones.length}`);
              
              // Generate ID if needed
              const milestoneId = milestone.id || `milestone-${Math.random().toString(36).substr(2, 9)}`;
              
              // Process timestamp
              let createdAt;
              if (milestone.createdAt instanceof Date) {
                createdAt = milestone.createdAt;
              } else if (milestone.createdAt?.toDate) {
                try {
                  createdAt = milestone.createdAt.toDate();
                  diagnostics.log(`[ENHANCED] Converted Firestore timestamp to Date for milestone ${index+1}`);
                } catch (err) {
                  diagnostics.warn(`[ENHANCED] Failed to convert timestamp for milestone ${index+1}`, err);
                  createdAt = new Date();
                }
              } else {
                createdAt = new Date();
              }
              
              return {
                ...milestone,
                id: milestoneId,
                createdAt: createdAt
              };
            });
            
            diagnostics.log(`[ENHANCED] Successfully processed ${formattedMilestones.length} milestones`);
          } catch (milestoneErr) {
            diagnostics.error('[ENHANCED] Error processing milestones:', milestoneErr);
            diagInfo.milestoneProcessingError = milestoneErr instanceof Error ? milestoneErr.message : 'Unknown milestone processing error';
            
            // Fallback to empty array if milestone processing fails
            formattedMilestones = [];
          }
          
          const processedRoadmap = {
            ...roadmapData,
            id: roadmapDoc.id,
            candidateId: candidateId,
            milestones: formattedMilestones || [],
            // Convert any Firebase timestamps to JS Dates
            createdAt: roadmapData.createdAt?.toDate?.() || new Date(),
            updatedAt: roadmapData.updatedAt?.toDate?.() || new Date()
          };
          
          // Log final roadmap object
          diagnostics.log('[ENHANCED] Final processed roadmap object:', {
            id: processedRoadmap.id,
            candidateId: processedRoadmap.candidateId,
            milestonesCount: processedRoadmap.milestones.length,
            createdAt: processedRoadmap.createdAt,
          });
          
          setRoadmap(processedRoadmap);
        } else {
          diagnostics.log('No roadmap found for this candidate');
        }
        
        setRoadmapLoading(false);
      } catch (err: any) {
        diagnostics.error('Error in data fetching process:', err);
        
        // Provide more specific error message based on the error
        if (err.message && err.message.includes('Permission denied')) {
          setError(err.message);
          diagInfo.errorType = 'permission-denied';
        } else if (err.code === 'unavailable') {
          setError('Firebase service is currently unavailable. Please try again later.');
          diagInfo.errorType = 'service-unavailable';
        } else {
        setError('Failed to load candidate information. Please try again later.');
          diagInfo.errorType = 'unknown';
        }
        
        diagInfo.errorMessage = err.message || 'No error message';
        diagInfo.errorCode = err.code || 'No error code';
        
        setLoading(false);
        setRoadmapLoading(false);
      } finally {
        setDiagnosticInfo(diagInfo);
      }
    }
    
    fetchCandidateData();
  }, [candidateId, recruiterProfile, currentUser, userProfile]);
  
  // Debug information view for non-production environments
  const renderDebugInfo = () => {
    // Always show debug info for now to help diagnose the issue
    // const isDev = process.env.NEXT_PUBLIC_DEVELOPMENT_MODE === 'true' || 
    //              (typeof window !== 'undefined' && window.location.hostname === 'localhost');
    
    // Always show debug in production for now, to help diagnose the issue
    // if (!isDev || !diagnosticInfo) return null;
    
    // Validate roadmap data structure if available
    let dataStructureValidation = null;
    if (roadmap) {
      const issues = [];
      
      if (!roadmap.id) issues.push('Missing roadmap.id');
      if (!roadmap.candidateId) issues.push('Missing roadmap.candidateId');
      
      if (!roadmap.milestones) {
        issues.push('Missing roadmap.milestones');
      } else if (!Array.isArray(roadmap.milestones)) {
        issues.push(`roadmap.milestones is not an array (type: ${typeof roadmap.milestones})`);
      } else {
        if (roadmap.milestones.length === 0) {
          issues.push('roadmap.milestones is an empty array');
        } else {
          // Check first milestone structure
          const firstMilestone = roadmap.milestones[0];
          const requiredFields = ['id', 'title', 'description', 'timeframe'];
          const missingFields = requiredFields.filter(field => {
            return firstMilestone[field as keyof typeof firstMilestone] === undefined;
          });
          
          if (missingFields.length > 0) {
            issues.push(`First milestone missing fields: ${missingFields.join(', ')}`);
          }
          
          // Check for any non-serializable values that might cause rendering issues
          try {
            JSON.stringify(roadmap);
          } catch (err) {
            issues.push('Roadmap contains non-serializable values');
          }
        }
      }
      
      dataStructureValidation = {
        valid: issues.length === 0,
        issues: issues,
        structure: {
          id: typeof roadmap.id,
          candidateId: typeof roadmap.candidateId,
          milestones: Array.isArray(roadmap.milestones) 
            ? `Array(${roadmap.milestones.length})` 
            : typeof roadmap.milestones,
          createdAt: roadmap.createdAt instanceof Date ? 'Date' : typeof roadmap.createdAt
        }
      };
    }
    
    return (
      <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs">
        <h3 className="font-bold mb-2">Debug Information</h3>
        
        {dataStructureValidation && (
          <div className="mb-4 p-3 bg-white rounded border">
            <h4 className="font-bold mb-2">Roadmap Structure Validation</h4>
            <div className={`p-2 rounded ${dataStructureValidation.valid ? 'bg-green-50' : 'bg-red-50'}`}>
              <p><strong>Valid:</strong> {dataStructureValidation.valid ? '✅' : '❌'}</p>
              
              {!dataStructureValidation.valid && (
                <div className="mt-2">
                  <p className="font-semibold">Issues:</p>
                  <ul className="list-disc pl-5">
                    {dataStructureValidation.issues.map((issue, i) => (
                      <li key={i} className="text-red-700">{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="mt-2">
                <p className="font-semibold">Structure:</p>
                <pre className="bg-gray-50 p-2 rounded overflow-auto">
                  {JSON.stringify(dataStructureValidation.structure, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
        
        <pre className="overflow-auto">{JSON.stringify(diagnosticInfo, null, 2)}</pre>
        
        <div className="mt-4">
          <h4 className="font-bold">Troubleshooting</h4>
          <ul className="list-disc pl-5">
            <li>
              <a 
                href="/debug/auth/recruiter" 
                target="_blank" 
                className="text-blue-500 underline"
              >
                Open Recruiter Debug Tool
              </a>
            </li>
            <li>
              <a 
                href="/debug/direct-roadmap-test" 
                target="_blank" 
                className="text-blue-500 underline"
              >
                Direct Roadmap Test Tool
              </a>
            </li>
            <li>
              View console logs for detailed diagnostic information
            </li>
            <li>
              Check the Firebase security rules
            </li>
          </ul>
        </div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
          {renderDebugInfo()}
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
          {renderDebugInfo()}
        </div>
      </div>
    );
  }
  
  // Check if the candidate has the recruiter's company as a target
  const isInterestedInCompany = candidate.targetCompanies?.some((company: any) => {
    return typeof company === 'string' 
      ? company.toLowerCase() === recruiterProfile?.company.toLowerCase() 
      : company.name && company.name.toLowerCase() === recruiterProfile?.company.toLowerCase();
  });
  
  // Get target position for the recruiter's company
  const targetPosition = candidate.targetCompanies?.find((company: any) => {
    return typeof company === 'object' && company.name && 
      company.name.toLowerCase() === recruiterProfile?.company.toLowerCase();
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
      
      {/* Career Roadmap Section */}
      <div className="mb-8 bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-blue-800">Career Roadmap</h2>
          {roadmap && (
            <div className="flex items-center">
              <button 
                onClick={() => setUseDirectRender(!useDirectRender)}
                className="mr-4 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-sm"
              >
                {useDirectRender ? 'Use Component Render' : 'Use Direct Render'}
              </button>
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
            </div>
          )}
        </div>
        
        {roadmapLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Loading roadmap...</span>
          </div>
        ) : roadmap ? (
          <>
            <div className="mb-4">
              <details className="bg-blue-50 p-3 rounded-lg">
                <summary className="font-medium text-blue-800 cursor-pointer">
                  Debug: View Simple Roadmap Display
                </summary>
                <div className="mt-4 p-4 bg-white rounded-lg border border-blue-100">
                  <h3 className="font-bold text-lg mb-3">Simple Roadmap Display</h3>
                  <p className="mb-2"><strong>Roadmap ID:</strong> {roadmap.id}</p>
                  <p className="mb-2"><strong>Candidate ID:</strong> {roadmap.candidateId}</p>
                  <p className="mb-2"><strong>Milestones:</strong> {roadmap.milestones?.length || 0}</p>
                  
                  {roadmap.milestones && roadmap.milestones.length > 0 ? (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Milestones:</h4>
                      <div className="space-y-3">
                        {roadmap.milestones.map((milestone, index) => (
                          <div key={milestone.id || `milestone-${index}`} className="p-3 bg-gray-50 rounded border">
                            <div className="flex justify-between">
                              <h5 className="font-bold">{milestone.title || 'Untitled'}</h5>
                              <span className="text-sm text-gray-500">{milestone.timeframe || 'No timeframe'}</span>
                            </div>
                            <p className="text-sm mt-1">{milestone.description || 'No description'}</p>
                            {milestone.skills && milestone.skills.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-semibold text-gray-700">Skills:</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {milestone.skills.map((skill, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="italic text-gray-500">No milestones found in roadmap data</p>
                  )}
                </div>
              </details>
            </div>
            
            {useDirectRender ? (
              <FallbackRoadmapComponent roadmap={roadmap} />
            ) : (
              <div className="roadmap-component-wrapper">
                <RoadmapErrorBoundary
                  fallback={<FallbackRoadmapComponent roadmap={roadmap} />}
                >
                  <CareerRoadmapComponent 
                    roadmap={roadmap} 
                    isEditable={false} // Recruiters can view but not edit
                  />
                </RoadmapErrorBoundary>
              </div>
            )}
          </>
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
        
        {renderDebugInfo()}
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