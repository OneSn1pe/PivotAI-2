'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function RecruiterDashboard() {
  const { userProfile, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner message="Loading dashboard..." />
      </div>
    );
  }

  if (!userProfile) {
    router.push('/auth/login');
    return null;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome, {userProfile.displayName || 'Recruiter'}
        </h1>
        <p className="text-gray-600">
          Manage candidates and track their career development progress.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-2">Browse Candidates</h3>
          <p className="text-sm text-gray-600 mb-4">
            View and search through candidate profiles
          </p>
          <button
            onClick={() => router.push('/protected/recruiter/candidates')}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            View Candidates →
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-2">Saved Profiles</h3>
          <p className="text-sm text-gray-600 mb-4">
            Access your saved candidate profiles
          </p>
          <button
            onClick={() => router.push('/protected/recruiter/saved')}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            View Saved →
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-2">Analytics</h3>
          <p className="text-sm text-gray-600 mb-4">
            View recruitment analytics and insights
          </p>
          <button
            onClick={() => router.push('/protected/recruiter/analytics')}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            View Analytics →
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="text-gray-600">
          <p>No recent activity to display.</p>
        </div>
      </div>
    </div>
  );
}