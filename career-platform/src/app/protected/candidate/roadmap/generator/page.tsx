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
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-4xl font-bold text-slate-800">Create Your Career Roadmap</h1>
        <button
          onClick={() => router.push('/protected/candidate/roadmap')}
          className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white px-6 py-2 rounded-lg text-sm font-medium shadow-md shadow-teal-500/30 transition-all duration-300"
        >
          Back
        </button>
      </div>
      
      <p className="text-slate-600 mb-6 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Quick process — generates a personalized career roadmap in under a minute
      </p>
      
      <div className="bg-white/80 backdrop-filter backdrop-blur-md p-6 rounded-2xl shadow-xl shadow-teal-200/50 border border-slate-100 mb-6">
        <RoadmapGenerator 
          resumeAnalysis={candidateProfile?.resumeAnalysis || null} 
          onRoadmapGenerated={handleRoadmapGenerated}
        />
      </div>
    </div>
  );
} 