'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user';

export default function AccessTestPage() {
  const { userProfile, loading } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [candidateId, setCandidateId] = useState<string>('');
  const [testResults, setTestResults] = useState<any>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };

  useEffect(() => {
    if (!loading) {
      addLog(`Auth loaded. User: ${userProfile?.displayName || 'None'}, Role: ${userProfile?.role || 'None'}`);
    }
  }, [loading, userProfile]);

  const testAccess = async () => {
    if (!candidateId) {
      addLog('Please enter a candidate ID');
      return;
    }

    addLog(`Testing access to candidate: ${candidateId}`);

    try {
      // Test API access
      addLog('Testing API access...');
      const response = await fetch(`/api/roadmaps/${candidateId}`);
      const data = await response.json();
      
      if (response.ok) {
        addLog('✅ API access successful');
        setTestResults({
          apiAccess: true,
          apiResponse: data
        });
      } else {
        addLog(`❌ API access failed: ${response.status} ${response.statusText}`);
        setTestResults({
          apiAccess: false,
          apiError: data
        });
      }
    } catch (error) {
      addLog(`❌ Error testing access: ${error instanceof Error ? error.message : String(error)}`);
      setTestResults({
        apiAccess: false,
        error: String(error)
      });
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Access Test Page</h1>
      
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-2">User Info</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div>
            <p><strong>User ID:</strong> {userProfile?.uid || 'Not logged in'}</p>
            <p><strong>Name:</strong> {userProfile?.displayName || 'N/A'}</p>
            <p><strong>Role:</strong> {userProfile?.role || 'N/A'}</p>
            <p><strong>Email:</strong> {userProfile?.email || 'N/A'}</p>
          </div>
        )}
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-2">Test Candidate Access</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={candidateId}
            onChange={(e) => setCandidateId(e.target.value)}
            placeholder="Enter candidate ID"
            className="border p-2 flex-grow rounded"
          />
          <button
            onClick={testAccess}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Test Access
          </button>
        </div>
        
        {testResults && (
          <div className="border p-4 rounded bg-gray-50">
            <h3 className="font-semibold">Test Results</h3>
            <pre className="mt-2 text-sm overflow-auto max-h-40 bg-gray-100 p-2 rounded">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Logs</h2>
        <div className="bg-gray-100 p-2 rounded h-60 overflow-y-auto">
          {logs.map((log, i) => (
            <div key={i} className="text-sm font-mono border-b border-gray-200 py-1">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 