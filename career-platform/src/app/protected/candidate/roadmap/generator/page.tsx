'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CandidateProfile } from '@/types/user';
import { useRouter } from 'next/navigation';
import RoadmapGenerator from '@/components/candidate/RoadmapGenerator';

export default function RoadmapGeneratorPage() {
  const { userProfile } = useAuth();
  const candidateProfile = userProfile as CandidateProfile | null;
  const router = useRouter();

  const handleRoadmapGenerated = async (roadmapId: string) => {
    // After regeneration, redirect back to the roadmap page
    router.push('/protected/candidate/roadmap');
  };

  if (!candidateProfile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-4xl font-bold text-gray-900">Create Your Career Roadmap</h1>
        <button
          onClick={() => router.push('/protected/candidate/roadmap')}
          className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Back
        </button>
      </div>
      
      <p className="text-gray-600 mb-6 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Quick process — generates a personalized career roadmap in under a minute
      </p>
      
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <RoadmapGenerator 
          resumeAnalysis={candidateProfile?.resumeAnalysis || null} 
          onRoadmapGenerated={handleRoadmapGenerated}
        />
      </div>
    </div>
  );
} 