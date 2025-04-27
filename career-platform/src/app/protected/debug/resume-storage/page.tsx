'use client';

import React from 'react';
import ResumeStorageDebug from '@/components/debug/ResumeStorageDebug';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function ResumeStorageDebugPage() {
  const { userProfile } = useAuth();
  const router = useRouter();
  
  if (!userProfile) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Resume Storage Debug</h1>
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800"
        >
          Back
        </button>
      </div>
      
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-md">
        <h2 className="font-semibold mb-2">Debug Information</h2>
        <p>
          This page helps diagnose issues with resume storage and retrieval. Use it to identify problems
          with uploaded resumes that result in 404 errors or similar issues.
        </p>
      </div>
      
      <ResumeStorageDebug />
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Common Issues</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>404 Not Found errors:</strong> Check if the file exists in Firebase Storage and if the URL is correctly formatted.
            </li>
            <li>
              <strong>Access Denied errors:</strong> Verify Firebase Storage security rules allow access to the files.
            </li>
            <li>
              <strong>CORS errors:</strong> Ensure CORS is properly configured for your storage bucket.
            </li>
            <li>
              <strong>File format issues:</strong> Some file formats may not be properly supported for direct viewing.
            </li>
          </ul>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Firebase Storage Structure</h2>
          <p className="mb-4 text-gray-600">
            Current resume storage pattern:
          </p>
          <pre className="bg-gray-100 p-3 rounded text-sm">
            {`resumes/
  ├── [userId]/
  │     ├── [timestamp]_resume.[extension]
  │     └── other uploaded files...
  └── other users...`}
          </pre>
          <p className="mt-4 text-sm text-gray-600">
            Each user's resume is stored in a directory with their userId.
            Files are named with a timestamp to avoid conflicts.
          </p>
        </div>
      </div>
    </div>
  );
} 