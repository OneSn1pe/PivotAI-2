'use client';

import React from 'react';
import TargetCompaniesForm from '@/components/candidate/TargetCompaniesForm';
import { useRouter } from 'next/navigation';

export default function PreferencesPage() {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Target Companies</h1>
        <button
          onClick={() => router.push('/protected/candidate/dashboard')}
          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
        >
          Back to Dashboard
        </button>
      </div>
      
      <div className="space-y-8">
        <TargetCompaniesForm />
      </div>
    </div>
  );
}