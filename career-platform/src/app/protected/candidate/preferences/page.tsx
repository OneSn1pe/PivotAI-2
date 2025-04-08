'use client';

import React from 'react';
import JobPreferencesForm from '@/components/candidate/JobPreferences';
import TargetCompanies from '@/components/candidate/TargetCompanies';

export default function PreferencesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Career Preferences</h1>
      
      <div className="space-y-8">
        <JobPreferencesForm />
        <TargetCompanies />
      </div>
    </div>
  );
}