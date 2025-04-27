'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import ResumeAnalysisDebug from '@/components/debug/ResumeAnalysisDebug';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user';

export default function ResumeAnalysisDebugPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  
  // Check for admin access (optional)
  const isAdmin = userProfile?.role === UserRole.RECRUITER; // Using RECRUITER as admin for now
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Resume Analysis Debugger</h1>
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800"
        >
          Back
        </button>
      </div>
      
      <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <p className="text-yellow-800">
          This tool helps diagnose issues with the resume analysis feature. 
          It directly tests the API and shows the raw response for debugging purposes.
        </p>
      </div>
      
      <ResumeAnalysisDebug />
      
      <div className="mt-8 p-4 bg-gray-50 rounded">
        <h2 className="text-lg font-bold mb-2">Additional Debugging Steps</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Check browser console for detailed logs and errors</li>
          <li>Verify that the OpenAI API key is set in environment variables</li>
          <li>Make sure the resume text is properly extracted from files</li>
          <li>Check the network tab for actual API requests/responses</li>
        </ul>
      </div>
    </div>
  );
} 