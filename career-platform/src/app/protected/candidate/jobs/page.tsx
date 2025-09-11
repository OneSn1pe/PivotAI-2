'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CandidateProfile } from '@/types/user';
import { JobMatchingResult } from '@/services/linkedinJobsService';
import JobRecommendations from '@/components/candidate/JobRecommendations';

export default function JobsPage() {
  const { userProfile } = useAuth();
  const candidateProfile = userProfile as CandidateProfile | null;
  const [activeTab, setActiveTab] = useState<'recommendations' | 'search' | 'saved'>('recommendations');
  const [recommendations, setRecommendations] = useState<JobMatchingResult[]>([]);

  const tabs = [
    { id: 'recommendations', label: 'Recommendations', icon: 'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' },
    { id: 'search', label: 'Search Jobs', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
    { id: 'saved', label: 'Saved Jobs', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
  ];

  if (!candidateProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Opportunities</h1>
        <p className="text-gray-600">
          Discover and analyze job opportunities tailored to your profile and career goals.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d={tab.icon} clipRule="evenodd" />
              </svg>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg">
        {activeTab === 'recommendations' && (
          <JobRecommendations 
            candidateProfile={candidateProfile}
            onRecommendationsUpdate={setRecommendations}
          />
        )}

        {activeTab === 'search' && (
          <div className="p-6">
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Job Search</h3>
              <p className="text-gray-600 mb-4">Custom job search functionality coming soon</p>
              <div className="bg-gray-50 rounded-lg p-4 text-left max-w-md mx-auto">
                <h4 className="font-medium text-gray-900 mb-2">Planned Features:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Advanced search filters</li>
                  <li>• Salary range filtering</li>
                  <li>• Company size preferences</li>
                  <li>• Industry-specific search</li>
                  <li>• Remote/hybrid options</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="p-6">
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Saved Jobs</h3>
              <p className="text-gray-600 mb-4">Save jobs from recommendations to review later</p>
              <div className="bg-gray-50 rounded-lg p-4 text-left max-w-md mx-auto">
                <h4 className="font-medium text-gray-900 mb-2">Coming Soon:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Bookmark interesting opportunities</li>
                  <li>• Track application status</li>
                  <li>• Set application reminders</li>
                  <li>• Compare saved opportunities</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {recommendations.length > 0 && activeTab === 'recommendations' && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-medium text-gray-900 mb-4">Your Job Market Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {recommendations.filter(r => r.matchScore >= 80).length}
              </div>
              <div className="text-sm text-gray-600">Excellent Matches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {recommendations.filter(r => r.matchScore >= 60).length}
              </div>
              <div className="text-sm text-gray-600">Good Matches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(recommendations.reduce((sum, r) => sum + r.matchScore, 0) / recommendations.length)}%
              </div>
              <div className="text-sm text-gray-600">Avg. Compatibility</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {new Set(recommendations.map(r => r.job.company.name)).size}
              </div>
              <div className="text-sm text-gray-600">Companies</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}