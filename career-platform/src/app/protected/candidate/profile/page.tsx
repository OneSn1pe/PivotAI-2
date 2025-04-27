'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ResumeManager from '@/components/candidate/ResumeManager';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
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
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
      
      <div className="mx-auto max-w-lg">
        <ResumeManager onUpdateComplete={() => router.refresh()} />
      </div>
      
      <div className="mt-8">
        <button
          onClick={() => router.push('/protected/candidate/preferences')}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full"
        >
          View Preferences
        </button>
      </div>
    </div>
  );
}