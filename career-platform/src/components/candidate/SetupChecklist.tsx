import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CandidateProfile, CareerRoadmap } from '@/types/user';

interface SetupChecklistProps {
  candidateProfile: CandidateProfile | null;
  roadmap: CareerRoadmap | null;
}

const LOCAL_STORAGE_KEY = 'pivotai_setup_checklist_minimized';

const SetupChecklist: React.FC<SetupChecklistProps> = ({ candidateProfile, roadmap }) => {
  const router = useRouter();
  const [isMinimized, setIsMinimized] = useState(false);

  // Determine completion status of each step
  const resumeUploaded = Boolean(candidateProfile?.resumeFileName);
  const hasTargetCompanies = Boolean(candidateProfile?.targetCompanies && candidateProfile.targetCompanies.length > 0);
  const roadmapGenerated = Boolean(roadmap);
  
  // Calculate overall progress
  const totalSteps = 3;
  const completedSteps = [resumeUploaded, hasTargetCompanies, roadmapGenerated].filter(Boolean).length;
  const progressPercentage = (completedSteps / totalSteps) * 100;
  
  // Initialize minimized state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState !== null) {
        setIsMinimized(savedState === 'true');
      } else {
        // Default to minimized if all steps are completed
        setIsMinimized(completedSteps === totalSteps);
      }
    }
  }, [completedSteps]);
  
  // Save minimized state to localStorage when it changes
  const handleToggleMinimize = () => {
    const newState = !isMinimized;
    setIsMinimized(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, String(newState));
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-card border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800 font-inter flex items-center">
          <span>Setup Progress</span>
          {completedSteps === totalSteps && (
            <span className="ml-2 text-xs font-normal text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
              Complete
            </span>
          )}
        </h2>
        
        <div className="flex items-center">
          <span className="text-sm font-medium text-slate-700 mr-4">
            {completedSteps}/{totalSteps} Complete
          </span>
          
          <button 
            onClick={handleToggleMinimize}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label={isMinimized ? "Expand setup checklist" : "Minimize setup checklist"}
          >
            {isMinimized ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {/* Progress Bar - always visible */}
      <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2">
        <div 
          className="bg-gradient-to-r from-teal-500 to-teal-400 h-2.5 rounded-full transition-all duration-500" 
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      
      {/* Minimized summary - shown when minimized */}
      {isMinimized && (
        <div className="text-xs text-slate-500 flex justify-between">
          <span>
            {completedSteps === totalSteps 
              ? "All setup steps completed" 
              : `${completedSteps} of ${totalSteps} setup steps completed`}
          </span>
          <button 
            onClick={() => setIsMinimized(false)}
            className="text-teal-600 hover:text-teal-800 font-medium"
          >
            Show details
          </button>
        </div>
      )}
      
      {/* Expanded content - shown when not minimized */}
      {!isMinimized && (
        <>
          {/* Checklist Items */}
          <div className="space-y-4 mt-4">
            {/* Resume Upload */}
            <div className="flex items-start">
              <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${resumeUploaded ? 'bg-teal-500' : 'bg-slate-200'}`}>
                {resumeUploaded ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="text-xs text-slate-500 font-bold">1</span>
                )}
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${resumeUploaded ? 'text-slate-700' : 'text-slate-600'}`}>
                    Upload Your Resume
                  </p>
                  {resumeUploaded ? (
                    <span className="text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-medium">Completed</span>
                  ) : (
                    <button
                      onClick={() => router.push('/protected/candidate/profile')}
                      className="text-xs text-teal-700 hover:text-teal-800 font-medium"
                    >
                      Do Now →
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {resumeUploaded 
                    ? `Resume "${candidateProfile?.resumeFileName}" uploaded successfully` 
                    : "Upload your resume to help us analyze your skills and experience"}
                </p>
              </div>
            </div>
            
            {/* Target Companies */}
            <div className="flex items-start">
              <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${hasTargetCompanies ? 'bg-teal-500' : resumeUploaded ? 'bg-slate-200' : 'bg-slate-100'}`}>
                {hasTargetCompanies ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className={`text-xs ${resumeUploaded ? 'text-slate-500' : 'text-slate-300'} font-bold`}>2</span>
                )}
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${hasTargetCompanies ? 'text-slate-700' : resumeUploaded ? 'text-slate-600' : 'text-slate-400'}`}>
                    Select Target Companies
                  </p>
                  {hasTargetCompanies ? (
                    <span className="text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-medium">Completed</span>
                  ) : resumeUploaded ? (
                    <button
                      onClick={() => router.push('/protected/candidate/profile?tab=target-companies')}
                      className="text-xs text-teal-700 hover:text-teal-800 font-medium"
                    >
                      Do Now →
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">Complete previous step</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {hasTargetCompanies
                    ? `${candidateProfile?.targetCompanies?.length} company targets selected`
                    : "Tell us which companies you're aiming for"}
                </p>
              </div>
            </div>
            
            {/* Roadmap Generation */}
            <div className="flex items-start">
              <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${roadmapGenerated ? 'bg-teal-500' : hasTargetCompanies ? 'bg-slate-200' : 'bg-slate-100'}`}>
                {roadmapGenerated ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className={`text-xs ${hasTargetCompanies ? 'text-slate-500' : 'text-slate-300'} font-bold`}>3</span>
                )}
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${roadmapGenerated ? 'text-slate-700' : hasTargetCompanies ? 'text-slate-600' : 'text-slate-400'}`}>
                    Generate Your Career Roadmap
                  </p>
                  {roadmapGenerated ? (
                    <span className="text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-medium">Completed</span>
                  ) : hasTargetCompanies ? (
                    <button
                      onClick={() => router.push('/protected/candidate/roadmap/generator')}
                      className="text-xs text-teal-700 hover:text-teal-800 font-medium"
                    >
                      Do Now →
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">Complete previous steps</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {roadmapGenerated
                    ? "Personalized career roadmap created"
                    : "Create a personalized path to achieve your career goals"}
                </p>
              </div>
            </div>
          </div>
          
          {completedSteps === totalSteps && (
            <div className="mt-6 text-center">
              <div className="bg-teal-50 p-3 rounded-lg">
                <div className="flex justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-teal-800 mt-1">All steps completed!</p>
                <p className="text-xs text-teal-600 mt-1">Your personalized career plan is ready.</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SetupChecklist; 