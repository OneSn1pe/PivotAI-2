'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { analyzeResume } from '@/services/openai';
import { ResumeAnalysis } from '@/types/user';
import logger from '@/utils/logger';

const log = logger.createNamespace('LinkedInImport');

export default function LinkedInProfileImport() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showImportOption, setShowImportOption] = useState(false);
  
  // Check local storage on mount to see if we have LinkedIn data to process
  useEffect(() => {
    const hasLinkedInProfile = localStorage.getItem('hasLinkedInProfile') === 'true';
    const linkedInToken = localStorage.getItem('linkedInToken');
    
    if (hasLinkedInProfile && linkedInToken) {
      setShowImportOption(true);
    }
  }, []);
  
  const importLinkedInProfile = async () => {
    if (!userProfile) {
      setError('You must be logged in to import your LinkedIn profile');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const linkedInToken = localStorage.getItem('linkedInToken');
      
      if (!linkedInToken) {
        throw new Error('LinkedIn token not found. Please log in again with LinkedIn.');
      }
      
      // Fetch LinkedIn profile data
      log.info('Fetching LinkedIn profile data');
      const profileResponse = await fetch('/api/linkedin/profile', {
        headers: {
          'Authorization': `Bearer ${linkedInToken}`
        }
      });
      
      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(errorData.error || 'Failed to fetch LinkedIn profile');
      }
      
      const profileData = await profileResponse.json();
      const { resumeText } = profileData;
      
      if (!resumeText) {
        throw new Error('Failed to convert LinkedIn profile to resume format');
      }
      
      log.info('LinkedIn profile fetched and converted to resume text format');
      
      // Analyze the resume text using our existing OpenAI service
      log.info('Analyzing LinkedIn profile as resume text');
      const resumeAnalysis = await analyzeResume(resumeText);
      
      // Update the user's profile with the LinkedIn-derived resume data
      await updateDoc(doc(db, 'users', userProfile.uid), {
        linkedInResumeUrl: 'linkedin-profile', // Placeholder URL indicating this is from LinkedIn
        resumeAnalysis: resumeAnalysis,
        updatedAt: new Date()
      });
      
      // Clear the LinkedIn data from local storage
      localStorage.removeItem('hasLinkedInProfile');
      localStorage.removeItem('linkedInToken');
      
      setSuccess('Your LinkedIn profile has been successfully imported and analyzed as a resume!');
      setShowImportOption(false);
      
      // Force reload after 1.5 seconds to show the updated profile
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      log.error('LinkedIn profile import error:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Don't render anything if there's no LinkedIn data to import
  if (!showImportOption) {
    return null;
  }
  
  return (
    <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold text-teal-800 mb-2">
        LinkedIn Profile Detected
      </h3>
      
      <p className="text-slate-700 mb-4">
        We detected that you signed in with LinkedIn. Would you like to import your LinkedIn profile data as a resume for analysis?
      </p>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-4">
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}
      
      <div className="flex gap-3">
        <button
          onClick={importLinkedInProfile}
          disabled={loading}
          className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded font-medium shadow-button hover:shadow-button-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Importing...' : 'Import LinkedIn Profile'}
        </button>
        
        <button
          onClick={() => {
            localStorage.removeItem('hasLinkedInProfile');
            localStorage.removeItem('linkedInToken');
            setShowImportOption(false);
          }}
          disabled={loading}
          className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded font-medium hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Skip
        </button>
      </div>
    </div>
  );
} 