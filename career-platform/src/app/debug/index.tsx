'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { isDevelopmentMode } from '@/utils/environment';

const DebugPage = () => {
  const { userProfile } = useAuth();
  const isDev = isDevelopmentMode();
  
  const debugTools = [
    {
      title: 'API Access Test',
      description: 'Test API access and authentication',
      path: '/debug/api-access-test',
      icon: '🔌'
    },
    {
      title: 'Access Test',
      description: 'Test protected route access',
      path: '/debug/access-test',
      icon: '🔒'
    },
    {
      title: 'Middleware Token',
      description: 'Debug auth middleware token',
      path: '/debug/middleware-token',
      icon: '🔑'
    },
    {
      title: 'Token Validation',
      description: 'Validate auth tokens',
      path: '/debug/token-validation',
      icon: '✅'
    },
    {
      title: 'Token Claims',
      description: 'View token claims',
      path: '/debug/token-claims',
      icon: '📝'
    },
    {
      title: 'Fix Session',
      description: 'Fix session cookie issues',
      path: '/debug/fix-session',
      icon: '🔧'
    },
    {
      title: 'Role Normalization',
      description: 'Fix user role issues',
      path: '/debug/role-normalization',
      icon: '👤'
    },
    {
      title: 'Firestore Rules Test',
      description: 'Test Firestore rules',
      path: '/debug/firestore-rules-test',
      icon: '🔥'
    },
    {
      title: 'Roadmap Access Test',
      description: 'Test roadmap access',
      path: '/debug/roadmap-access-test',
      icon: '🗺️'
    },
    {
      title: 'Roadmap Rendering Debug',
      description: 'Debug roadmap rendering issues',
      path: '/debug/roadmap-rendering-debug',
      icon: '📊'
    },
    {
      title: 'Direct Roadmap Test',
      description: 'Test roadmap API directly',
      path: '/debug/direct-roadmap-test',
      icon: '🧪'
    },
    {
      title: 'Role Solution Test',
      description: 'Test role solution implementation',
      path: '/debug/role-solution-test',
      icon: '🛠️'
    },
    {
      title: 'Solution Instructions',
      description: 'View solution instructions',
      path: '/debug/solution-instructions',
      icon: '📋'
    },
    {
      title: 'Environment Diff Test',
      description: 'Test environment variable differences',
      path: '/debug/environment-diff-test',
      icon: '🌍'
    },
    {
      title: 'Recruiter Roadmap Test',
      description: 'Test recruiter roadmap access',
      path: '/debug/recruiter-roadmap-test',
      icon: '👔'
    },
    {
      title: 'Interested Candidates',
      description: 'Debug interested candidates list',
      path: '/debug/interested-candidates',
      icon: '👥'
    },
    {
      title: 'Resume API Debug',
      description: 'Debug the resume analysis API',
      path: '/debug/resume-api-debug',
      icon: '📄'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Debug Tools</h1>
      
      <div className="mb-8">
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h2 className="font-bold mb-2">Environment Information</h2>
          <p><strong>Environment:</strong> {isDev ? 'Development' : 'Production'}</p>
          <p><strong>User:</strong> {userProfile ? `${userProfile.email} (${userProfile.role})` : 'Not logged in'}</p>
        </div>
        
        <p className="text-gray-600 mb-4">
          Use these tools to diagnose and fix issues with the application. Select a tool below to get started.
        </p>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <h2 className="text-xl font-bold text-yellow-800 mb-2">Getting Started with Debugging</h2>
          <p className="text-yellow-700 mb-2">
            If you're experiencing issues, we recommend checking these areas first:
          </p>
          <ol className="list-decimal pl-6 space-y-1 text-yellow-700">
            <li>Check <strong>API Access Test</strong> to verify your API connection</li>
            <li>Use <strong>Token Validation</strong> to confirm your auth tokens are valid</li>
            <li>Use <strong>Firestore Rules Test</strong> to verify database access permissions</li>
            <li>If you identify token issues, use <strong>Fix Session</strong> to repair your session cookie</li>
            <li>For resume analysis issues, use <strong>Resume API Debug</strong> to test the API directly</li>
          </ol>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {debugTools.map((tool, index) => (
          <Link href={tool.path} key={index}>
            <div className="bg-white p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2" role="img" aria-label={tool.title}>
                  {tool.icon}
                </span>
                <h2 className="text-lg font-semibold">{tool.title}</h2>
              </div>
              <p className="text-gray-600 text-sm">{tool.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DebugPage; 