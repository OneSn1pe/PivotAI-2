'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { CandidateProfile, RecruiterProfile } from '@/types/user';
import CareerRoadmapComponent from '@/components/candidate/CareerRoadmap';
import { UserRole } from '@/types/user';
import { useRoadmapAccess } from '@/hooks/useRoadmapAccess';

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
const FallbackRoadmapComponent = ({ roadmap }: { roadmap: any }) => {
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
        {roadmap.milestones.map((milestone: any, index: number) => (
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
                  {milestone.skills.map((skill: string, i: number) => (
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
  
  // Use our custom hook for roadmap access
  const { 
    roadmap, 
    candidate, 
    loading: roadmapLoading, 
    error: roadmapError,
    hasAccess 
  } = useRoadmapAccess(candidateId);
  
  // Add detailed debug logging
  diagnostics.log(`Initializing page with candidateId=${candidateId}`, userProfile ? {
    uid: userProfile.uid,
    role: userProfile.role,
    displayName: userProfile.displayName,
    isRecruiter: userProfile.role === UserRole.RECRUITER,
    hasAccess
  } : 'null');
  
  // Add state to toggle between regular and direct render
  const [useDirectRender, setUseDirectRender] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null);
  
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
  
  // Update component state based on the hook results
  useEffect(() => {
    if (!roadmapLoading) {
      setLoading(false);
      
      if (roadmapError) {
        setError(roadmapError);
        setDiagnosticInfo({ 
          roadmapError,
          hasAccess
        });
      }
    }
  }, [roadmapLoading, roadmapError, hasAccess]);
  
  // Render error state
  if (error || roadmapError) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error || roadmapError || 'An error occurred while loading the candidate profile.'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h1 className="text-2xl font-bold mb-4">Access Error</h1>
          <p className="text-gray-700 mb-4">
            There was a problem accessing this candidate profile. This could be due to:
          </p>
          <ul className="list-disc pl-5 mb-4 text-gray-700">
            <li>You don't have permission to view this candidate</li>
            <li>The candidate profile doesn't exist</li>
            <li>There was a server error</li>
          </ul>
          <button
            onClick={() => router.push('/protected/recruiter/dashboard')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Return to Dashboard
          </button>
        </div>
        
        {diagnosticInfo && (
          <div className="bg-gray-100 p-4 rounded-lg text-xs font-mono overflow-auto max-h-64">
            <h3 className="font-bold mb-2">Diagnostic Information:</h3>
            <pre>{JSON.stringify(diagnosticInfo, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  }

  // Render loading state
  if (loading || roadmapLoading) {
    return (
      <div className="flex justify-center items-center h-full py-12">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading candidate profile...</p>
        </div>
      </div>
    );
  }

  // Render candidate profile and roadmap
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{candidate?.displayName || 'Candidate Profile'}</h1>
        <button
          onClick={() => router.push('/protected/recruiter/dashboard')}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Profile Information</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm text-gray-500">Name</h3>
                <p className="font-medium">{candidate?.displayName || 'N/A'}</p>
              </div>
              
              <div>
                <h3 className="text-sm text-gray-500">Email</h3>
                <p className="font-medium">{candidate?.email || 'N/A'}</p>
              </div>
              
              {candidate?.resumeAnalysis?.skills && (
                <div>
                  <h3 className="text-sm text-gray-500 mb-1">Skills</h3>
                  <div className="flex flex-wrap gap-1">
                    {candidate.resumeAnalysis.skills.map((skill, index) => (
                      <span 
                        key={index}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Render target companies if available */}
          {candidate?.targetCompanies && candidate.targetCompanies.length > 0 && (
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
        
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Career Roadmap</h2>
            
            {roadmap ? (
              <RoadmapErrorBoundary
                fallback={<FallbackRoadmapComponent roadmap={roadmap} />}
              >
                {useDirectRender ? (
                  <FallbackRoadmapComponent roadmap={roadmap} />
                ) : (
                  <CareerRoadmapComponent 
                    roadmap={roadmap}
                    isEditable={false}
                  />
                )}
              </RoadmapErrorBoundary>
            ) : (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-gray-700">No roadmap available for this candidate.</p>
              </div>
            )}
            
            {roadmap && (
              <div className="mt-4 text-right">
                <button
                  onClick={() => setUseDirectRender(!useDirectRender)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  {useDirectRender ? 'Use standard view' : 'Use simplified view'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 