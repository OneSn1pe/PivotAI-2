'use client';

import React from 'react';
import JobPreferencesForm from '@/components/candidate/JobPreferences';
import TargetCompanies from '@/components/candidate/TargetCompanies';
import { useRouter } from 'next/navigation';

export default function PreferencesPage() {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Career Preferences</h1>
        <button
          onClick={() => router.push('/protected/candidate/dashboard')}
          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
        >
          Back to Dashboard
        </button>
      </div>
      
      <div className="space-y-8">
        <JobPreferencesForm />
        <TargetCompanies />
      </div>
    </div>
  );
}