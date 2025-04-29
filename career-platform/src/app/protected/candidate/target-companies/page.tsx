'use client';

import React, { useState } from 'react';
import TargetCompaniesForm from '@/components/candidate/TargetCompaniesForm';
import { useRouter } from 'next/navigation';

export default function TargetCompaniesPage() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleBackToDashboard = () => {
    if (isNavigating) return; // Prevent multiple clicks
    
    setIsNavigating(true);
    
    try {
      router.push('/protected/candidate/dashboard');
      
      // Safety timeout in case navigation gets stuck
      setTimeout(() => {
        if (window.location.pathname.includes('target-companies')) {
          console.warn('Navigation may be stuck, trying direct redirect');
          window.location.href = '/protected/candidate/dashboard';
        }
      }, 2000);
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to direct navigation
      window.location.href = '/protected/candidate/dashboard';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Target Companies</h1>
        <button
          onClick={handleBackToDashboard}
          disabled={isNavigating}
          className={`bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded flex items-center ${
            isNavigating ? 'opacity-75 cursor-not-allowed' : ''
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          {isNavigating ? 'Navigating...' : 'Back to Dashboard'}
        </button>
      </div>
      
      <div className="space-y-8">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">Why Target Companies Matter</h2>
          <p className="text-gray-700">
            Adding companies you're interested in working for helps us tailor your career roadmap specifically to your goals. 
            This information will be used to generate personalized milestones and recommendations that align with the skills 
            and qualifications needed for your target roles.
          </p>
          <div className="mt-3 p-3 bg-white rounded border border-blue-100">
            <p className="text-sm text-gray-600">
              <strong>Tip:</strong> Be specific about both the company and the position you're targeting. Include the exact job title 
              you're interested in (e.g., "Senior Frontend Developer" rather than just "Developer").
            </p>
          </div>
        </div>
        <TargetCompaniesForm />
      </div>
    </div>
  );
} 