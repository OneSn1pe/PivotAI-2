'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { isDevelopmentMode } from '@/utils/environment';

export default function DebugIndexPage() {
  const { userProfile } = useAuth();
  const isDev = isDevelopmentMode();
  
  const debugTools = [
    {
      title: 'Token Validation',
      description: 'Debug JWT token validation and session cookies',
      path: '/debug/token-validation',
      icon: '🔑'
    },
    {
      title: 'API Access Test',
      description: 'Test API access to roadmaps with detailed logging',
      path: '/debug/api-access-test',
      icon: '🔌'
    },
    {
      title: 'Environment Differences',
      description: 'Test differences between development and production environments',
      path: '/debug/environment-diff-test',
      icon: '🔍'
    },
    {
      title: 'Firestore Rules Test',
      description: 'Test Firestore security rules for roadmaps collection',
      path: '/debug/firestore-rules-test',
      icon: '🔒'
    },
    {
      title: 'Fix Session',
      description: 'Fix session cookie issues by setting a new cookie',
      path: '/debug/fix-session',
      icon: '🛠️'
    },
    {
      title: 'Roadmap Access Test',
      description: 'Test access to candidate roadmaps',
      path: '/debug/roadmap-access-test',
      icon: '🗺️'
    },
    {
      title: 'Interested Candidates Debug',
      description: 'Debug interested candidates filtering',
      path: '/debug/interested-candidates',
      icon: '👥'
    }
  ];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Debug Tools</h1>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="font-bold mb-2">Environment Information</h2>
        <p><strong>Environment:</strong> {isDev ? 'Development' : 'Production'}</p>
        <p><strong>User:</strong> {userProfile ? `${userProfile.email} (${userProfile.role})` : 'Not logged in'}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {debugTools.map((tool, index) => (
          <Link 
            href={tool.path} 
            key={index}
            className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all"
          >
            <div className="flex items-center">
              <div className="text-3xl mr-3">{tool.icon}</div>
              <div>
                <h3 className="font-bold">{tool.title}</h3>
                <p className="text-sm text-gray-600">{tool.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
        <h2 className="font-bold mb-2">Debugging Instructions</h2>
        <p className="mb-2">If you're experiencing issues with recruiters accessing candidate roadmaps:</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Use <strong>Token Validation</strong> to check if your tokens have the correct role claims</li>
          <li>Use <strong>API Access Test</strong> to directly test the roadmaps API endpoint</li>
          <li>Use <strong>Environment Differences</strong> to identify discrepancies between dev and prod</li>
          <li>Use <strong>Firestore Rules Test</strong> to verify database access permissions</li>
          <li>If you identify token issues, use <strong>Fix Session</strong> to repair your session cookie</li>
        </ol>
      </div>
    </div>
  );
} 