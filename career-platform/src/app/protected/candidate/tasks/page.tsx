'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import DailyTaskManager from '@/components/candidate/DailyTaskManager';
import { CandidateProfile } from '@/types/user';

export default function DailyTasksPage() {
  const { userProfile, loading } = useAuth();
  const router = useRouter();
  const candidateProfile = userProfile as CandidateProfile | null;

  // Redirect if not a candidate
  if (!loading && userProfile && userProfile.role !== 'candidate') {
    router.push('/dashboard');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!userProfile) {
    router.push('/auth/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <nav className="flex items-center space-x-2 text-sm text-slate-600">
            <button
              onClick={() => router.push('/protected/candidate/dashboard')}
              className="hover:text-slate-800 transition-colors"
            >
              Dashboard
            </button>
            <span>›</span>
            <span className="text-slate-800 font-medium">Daily Tasks</span>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="py-8">
        <DailyTaskManager />
      </div>

      {/* Quick actions floating button */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push('/protected/candidate/roadmap')}
            className="bg-white hover:bg-slate-50 text-slate-700 p-3 rounded-full shadow-lg border border-slate-200 transition-all duration-200 hover:shadow-xl"
            title="View Roadmap"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </button>
          
          <button
            onClick={() => router.push('/protected/candidate/dashboard')}
            className="bg-teal-600 hover:bg-teal-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl"
            title="Dashboard"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
} 