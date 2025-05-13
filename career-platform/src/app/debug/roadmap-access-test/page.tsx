'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function RoadmapAccessTestPage() {
  const { userProfile } = useAuth();
  const [candidateId, setCandidateId] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const testAccess = async () => {
    if (!candidateId) {
      setError('Please enter a candidate ID');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/debug/roadmap-access?candidateId=${candidateId}`);
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Roadmap Access Test</h1>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="font-bold mb-2">Current User</h2>
        {userProfile ? (
          <div>
            <p><span className="font-semibold">UID:</span> {userProfile.uid}</p>
            <p><span className="font-semibold">Email:</span> {userProfile.email}</p>
            <p><span className="font-semibold">Role:</span> {userProfile.role}</p>
          </div>
        ) : (
          <p className="text-red-500">Not logged in</p>
        )}
      </div>
      
      <div className="mb-6">
        <label className="block font-semibold mb-2">Candidate ID to Test:</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={candidateId}
            onChange={(e) => setCandidateId(e.target.value)}
            className="border rounded px-3 py-2 flex-grow"
            placeholder="Enter candidate ID"
          />
          <button
            onClick={testAccess}
            disabled={loading || !userProfile}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Access'}
          </button>
        </div>
        {error && (
          <p className="text-red-500 mt-2">{error}</p>
        )}
      </div>
      
      {results && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-2">Test Results</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold mb-2">Authentication</h3>
              <div className={`p-2 rounded ${results.auth.validation.success ? 'bg-green-100' : 'bg-red-100'}`}>
                <p><span className="font-semibold">Status:</span> {results.auth.validation.success ? 'Success' : 'Failed'}</p>
                {results.auth.validation.error && (
                  <p><span className="font-semibold">Error:</span> {results.auth.validation.error}</p>
                )}
                {results.auth.user && (
                  <>
                    <p><span className="font-semibold">User ID:</span> {results.auth.user.uid}</p>
                    <p><span className="font-semibold">Role:</span> {results.auth.user.role}</p>
                    <p><span className="font-semibold">Is Owner:</span> {results.auth.user.isOwner ? 'Yes' : 'No'}</p>
                    <p><span className="font-semibold">Is Recruiter:</span> {results.auth.user.isRecruiter ? 'Yes' : 'No'}</p>
                    <p><span className="font-semibold">Has Access:</span> {results.auth.user.hasAccess ? 'Yes' : 'No'}</p>
                  </>
                )}
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold mb-2">Roadmap</h3>
              <div className={`p-2 rounded ${results.roadmap.result.success ? 'bg-green-100' : 'bg-red-100'}`}>
                <p><span className="font-semibold">Query Success:</span> {results.roadmap.result.success ? 'Yes' : 'No'}</p>
                <p><span className="font-semibold">Roadmap Found:</span> {results.roadmap.result.found ? 'Yes' : 'No'}</p>
                {results.roadmap.result.error && (
                  <p><span className="font-semibold">Error:</span> {results.roadmap.result.error}</p>
                )}
                {results.roadmap.result.data && (
                  <>
                    <p><span className="font-semibold">Roadmap ID:</span> {results.roadmap.result.data.id}</p>
                    <p><span className="font-semibold">Milestones:</span> {results.roadmap.result.data.milestoneCount}</p>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold mb-2">Raw Response</h3>
            <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-96 text-xs">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
} 