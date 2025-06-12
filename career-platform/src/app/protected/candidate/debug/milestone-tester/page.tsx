'use client';

import React from 'react';
import { MilestoneGenerationTester } from '@/components/debug/MilestoneGenerationTester';

export default function MilestoneTesterPage() {
  // Only show in development environment
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12 bg-red-50 rounded-lg border border-red-200">
          <h2 className="text-2xl font-bold mb-4 text-red-800">Access Denied</h2>
          <p className="text-red-600">
            This debugging tool is only available in development environment.
          </p>
        </div>
      </div>
    );
  }

  return <MilestoneGenerationTester />;
}