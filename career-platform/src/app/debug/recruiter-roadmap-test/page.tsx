'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user';
import { setSessionCookie } from '@/config/firebase';

export default function RecruiterRoadmapTestPage() {
  const { userProfile, currentUser } = useAuth();
  const [candidateId, setCandidateId] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [environment, setEnvironment] = useState<any>({
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NEXT_PUBLIC_DEVELOPMENT_MODE === 'true',
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'server'
  });
  
  const runTest = async () => {
    if (!candidateId) {
      setError('Please enter a candidate ID');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResults(null);
    
    try {
      // First get a fresh token
      let token = '';
      if (currentUser) {
        token = await currentUser.getIdToken(true);
        console.log('Got fresh token:', token.substring(0, 10) + '...');
        
        // Set the token in cookie for server-side auth using the improved function
        const cookieSet = setSessionCookie(token);
        console.log('Session cookie set:', cookieSet);
      }
      
      // Call our debug API endpoint
      const response = await fetch(`/api/debug/recruiter-roadmap-test?candidateId=${candidateId}`, {
        headers: {
          'X-Debug-Mode': 'true',
          'X-Environment-Info': JSON.stringify(environment)
        }
      });
      
      const data = await response.json();
      setResults(data);
      
      // Also test the actual roadmap API endpoint
      try {
        const roadmapResponse = await fetch(`/api/roadmaps/${candidateId}`, {
          headers: {
            'X-Debug-Mode': 'true',
            'X-Allow-Recruiter-Test': 'true',
            'X-Environment-Info': JSON.stringify(environment)
          }
        });
        
        const roadmapData = await roadmapResponse.json();
        setResults((prev: any) => ({
          ...prev,
          actualApiTest: {
            status: roadmapResponse.status,
            statusText: roadmapResponse.statusText,
            data: roadmapData
          }
        }));
      } catch (roadmapError) {
        console.error('Error testing actual roadmap API:', roadmapError);
        setResults((prev: any) => ({
          ...prev,
          actualApiTest: {
            error: String(roadmapError)
          }
        }));
      }
    } catch (err) {
      console.error('Error running test:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Recruiter Roadmap Access Test</h1>
      
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Environment Info</h2>
        <div className="space-y-1">
          <p><strong>Production:</strong> {environment.isProduction ? 'Yes' : 'No'}</p>
          <p><strong>Development Mode:</strong> {environment.isDevelopment ? 'Yes' : 'No'}</p>
          <p><strong>Hostname:</strong> {environment.hostname}</p>
          <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</p>
        </div>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Current User Info</h2>
        <div className="space-y-1">
          <p><strong>Logged in:</strong> {currentUser ? 'Yes' : 'No'}</p>
          {userProfile && (
            <>
              <p><strong>User ID:</strong> {userProfile.uid}</p>
              <p><strong>Email:</strong> {userProfile.email}</p>
              <p><strong>Role:</strong> {userProfile.role}</p>
              <p><strong>Is Recruiter:</strong> {userProfile.role === UserRole.RECRUITER ? 'Yes' : 'No'}</p>
            </>
          )}
        </div>
      </div>
      
      <div className="mb-6">
        <label className="block mb-2 font-medium">Candidate ID to Test:</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={candidateId}
            onChange={(e) => setCandidateId(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-3 py-2"
            placeholder="Enter candidate ID"
          />
          <button
            onClick={runTest}
            disabled={loading || !candidateId}
            className={`px-4 py-2 rounded ${
              loading || !candidateId
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {loading ? 'Testing...' : 'Run Test'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}
      
      {results && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Test Results</h2>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium mb-2">Authentication</h3>
            <div className="bg-gray-50 p-3 rounded overflow-auto">
              <pre className="text-sm">
                {JSON.stringify({
                  sessionCookie: results.auth.sessionCookie,
                  validation: results.auth.validation,
                  user: {
                    uid: results.auth.user?.uid,
                    role: results.auth.user?.role,
                    isRecruiter: results.auth.user?.isRecruiter
                  }
                }, null, 2)}
              </pre>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium mb-2">Recruiter Check</h3>
            <div className="bg-gray-50 p-3 rounded overflow-auto">
              <pre className="text-sm">
                {JSON.stringify(results.recruiterCheck, null, 2)}
              </pre>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium mb-2">Roadmap Query</h3>
            <div className="bg-gray-50 p-3 rounded overflow-auto">
              <pre className="text-sm">
                {JSON.stringify(results.roadmap.result, null, 2)}
              </pre>
            </div>
          </div>
          
          {results.actualApiTest && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium mb-2">Actual API Test</h3>
              <p className="mb-2">
                <strong>Status:</strong> {results.actualApiTest.status} {results.actualApiTest.statusText}
              </p>
              <div className="bg-gray-50 p-3 rounded overflow-auto">
                <pre className="text-sm">
                  {JSON.stringify(results.actualApiTest.data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 