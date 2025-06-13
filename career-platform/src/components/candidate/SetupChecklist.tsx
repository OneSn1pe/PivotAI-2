import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CandidateProfile, CareerRoadmap } from '@/types/user';

interface SetupChecklistProps {
  candidateProfile: CandidateProfile | null;
  roadmap: CareerRoadmap | null;
}

const LOCAL_STORAGE_KEY = 'pivotai_setup_checklist_minimized';
const LOCAL_STORAGE_DISMISSED_KEY = 'pivotai_setup_checklist_dismissed';

const SetupChecklist: React.FC<SetupChecklistProps> = ({ candidateProfile, roadmap }) => {
  const router = useRouter();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Determine completion status of each step
  const resumeUploaded = Boolean(candidateProfile?.resumeFileName);
  const hasTargetCompanies = Boolean(candidateProfile?.targetCompanies && candidateProfile.targetCompanies.length > 0 && 
    // Ensure at least one company has a non-empty name
    candidateProfile.targetCompanies.some(company => company.name.trim() !== ''));
  const roadmapGenerated = Boolean(roadmap);
  
  // Calculate overall progress
  const totalSteps = 3;
  const completedSteps = [resumeUploaded, hasTargetCompanies, roadmapGenerated].filter(Boolean).length;
  const progressPercentage = (completedSteps / totalSteps) * 100;
  const isCompleted = completedSteps === totalSteps;

  // Initialize state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if user has dismissed the component when completed
      const dismissed = localStorage.getItem(LOCAL_STORAGE_DISMISSED_KEY);
      if (dismissed === 'true' && isCompleted) {
        setIsDismissed(true);
        return;
      }

      // Initialize minimized state
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState !== null) {
        setIsMinimized(savedState === 'true');
      } else {
        // Default to minimized if all steps are completed
        setIsMinimized(isCompleted);
      }
    }
  }, [completedSteps, isCompleted]);
  
  // Save minimized state to localStorage when it changes
  const handleToggleMinimize = () => {
    const newState = !isMinimized;
    setIsMinimized(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, String(newState));
    }
  };

  // Handle dismissing the component permanently when completed
  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_DISMISSED_KEY, 'true');
    }
  };

  // Reset dismissal if setup becomes incomplete again
  useEffect(() => {
    if (!isCompleted && isDismissed) {
      setIsDismissed(false);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(LOCAL_STORAGE_DISMISSED_KEY);
      }
    }
  }, [isCompleted, isDismissed]);

  // Don't render if dismissed
  if (isDismissed) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <span>Setup Progress</span>
          {isCompleted && (
            <span className="ml-2 text-xs font-normal text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
              Complete
            </span>
          )}
        </h2>
        
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-700 mr-4">
            {completedSteps}/{totalSteps} Complete
          </span>
          
          {isCompleted ? (
            <button 
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Dismiss setup checklist"
              title="Hide this checklist permanently"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          ) : (
            <button 
              onClick={handleToggleMinimize}
              className="text-gray-400 hover:text-gray-600 transition-colors"
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
          )}
        </div>
      </div>
      
      {/* Progress Bar - always visible */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div 
          className="bg-gray-900 h-2 rounded-full transition-all duration-500" 
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      
      {/* Completion notice with dismiss option */}
      {isCompleted && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-800">Setup completed!</p>
                <p className="text-xs text-gray-600">Your personalized career plan is ready.</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      
      {/* Minimized summary - shown when minimized and not completed */}
      {isMinimized && !isCompleted && (
        <div className="text-xs text-gray-500 flex justify-between">
          <span>
            {completedSteps} of {totalSteps} setup steps completed
          </span>
          <button 
            onClick={() => setIsMinimized(false)}
            className="text-gray-600 hover:text-gray-800 font-medium"
          >
            Show details
          </button>
        </div>
      )}
      
      {/* Expanded content - shown when not minimized and not completed */}
      {!isMinimized && !isCompleted && (
        <>
          {/* Checklist Items */}
          <div className="space-y-4 mt-4">
            {/* Resume Upload */}
            <div className="flex items-start">
              <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${resumeUploaded ? 'bg-gray-900' : 'bg-gray-200'}`}>
                {resumeUploaded ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="text-xs text-gray-500 font-bold">1</span>
                )}
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${resumeUploaded ? 'text-gray-700' : 'text-gray-600'}`}>
                    Upload Your Resume
                  </p>
                  {resumeUploaded ? (
                    <span className="text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full font-medium">Completed</span>
                  ) : (
                    <button
                      onClick={() => router.push('/protected/candidate/profile')}
                      className="text-xs text-gray-700 hover:text-gray-800 font-medium"
                    >
                      Do Now
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {resumeUploaded 
                    ? `Resume "${candidateProfile?.resumeFileName}" uploaded successfully` 
                    : "Upload your resume to help us analyze your skills and experience"}
                </p>
              </div>
            </div>
            
            {/* Target Companies */}
            <div className="flex items-start">
              <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${hasTargetCompanies ? 'bg-gray-900' : resumeUploaded ? 'bg-gray-200' : 'bg-gray-100'}`}>
                {hasTargetCompanies ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className={`text-xs ${resumeUploaded ? 'text-gray-500' : 'text-gray-300'} font-bold`}>2</span>
                )}
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${hasTargetCompanies ? 'text-gray-700' : resumeUploaded ? 'text-gray-600' : 'text-gray-400'}`}>
                    Select Target Companies
                  </p>
                  {hasTargetCompanies ? (
                    <span className="text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full font-medium">Completed</span>
                  ) : resumeUploaded ? (
                    <button
                      onClick={() => router.push('/protected/candidate/profile?tab=target-companies')}
                      className="text-xs text-gray-700 hover:text-gray-800 font-medium"
                    >
                      Do Now
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">Complete previous step</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {hasTargetCompanies
                    ? `${candidateProfile?.targetCompanies?.filter(company => company.name.trim() !== '').length} company targets selected`
                    : "Tell us which companies you're aiming for"}
                </p>
              </div>
            </div>
            
            {/* Roadmap Generation */}
            <div className="flex items-start">
              <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${roadmapGenerated ? 'bg-gray-900' : hasTargetCompanies ? 'bg-gray-200' : 'bg-gray-100'}`}>
                {roadmapGenerated ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className={`text-xs ${hasTargetCompanies ? 'text-gray-500' : 'text-gray-300'} font-bold`}>3</span>
                )}
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${roadmapGenerated ? 'text-gray-700' : hasTargetCompanies ? 'text-gray-600' : 'text-gray-400'}`}>
                    Generate Your Career Roadmap
                  </p>
                  {roadmapGenerated ? (
                    <span className="text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full font-medium">Completed</span>
                  ) : hasTargetCompanies ? (
                    <button
                      onClick={() => router.push('/protected/candidate/roadmap/generator')}
                      className="text-xs text-gray-700 hover:text-gray-800 font-medium"
                    >
                      Do Now
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">Complete previous steps</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {roadmapGenerated
                    ? "Personalized career roadmap created"
                    : "Create a personalized path to achieve your career goals"}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SetupChecklist; 