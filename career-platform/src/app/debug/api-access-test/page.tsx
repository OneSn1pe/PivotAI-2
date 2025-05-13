'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getCookie } from '@/utils/environment';

export default function ApiAccessTestPage() {
  const { userProfile, currentUser } = useAuth();
  const [candidateId, setCandidateId] = useState('0AZJyS2HH1OXTHdE6QvvzuPYmMA3'); // Default test candidate
  const [logs, setLogs] = useState<string[]>([]);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toISOString().substring(11, 19)} - ${message}`]);
  };

  const clearLogs = () => {
    setLogs([]);
    setApiResponse(null);
  };

  const testRoadmapApi = async () => {
    clearLogs();
    setLoading(true);
    
    addLog('🔍 Testing roadmap API access...');
    addLog(`Candidate ID: ${candidateId}`);
    
    // Log user and token information
    addLog(`User logged in: ${!!currentUser}`);
    if (currentUser) {
      addLog(`User ID: ${currentUser.uid}`);
      addLog(`User role (from profile): ${userProfile?.role || 'unknown'}`);
      
      try {
        const tokenResult = await currentUser.getIdTokenResult();
        addLog(`Token role claim: ${tokenResult.claims.role || 'not set'}`);
      } catch (err) {
        addLog(`❌ Error getting token claims: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    
    // Log cookie information
    const sessionCookie = getCookie('session');
    addLog(`Session cookie present: ${!!sessionCookie}`);
    if (sessionCookie) {
      addLog(`Session cookie length: ${sessionCookie.length} characters`);
    }
    
    try {
      // Make the API request with detailed logging
      addLog(`Sending request to /api/roadmaps/${candidateId}...`);
      
      const startTime = performance.now();
      const response = await fetch(`/api/roadmaps/${candidateId}`, {
        headers: {
          'X-Debug-Mode': 'true'
        }
      });
      const endTime = performance.now();
      
      addLog(`Response received in ${(endTime - startTime).toFixed(2)}ms`);
      addLog(`Status code: ${response.status} (${response.statusText})`);
      
      // Log response headers
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
        addLog(`Header: ${key}: ${value}`);
      });
      
      // Try to parse response body
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
          addLog('Response body parsed as JSON');
        } catch (err) {
          addLog(`❌ Error parsing JSON response: ${err instanceof Error ? err.message : String(err)}`);
          data = { error: 'Failed to parse JSON response' };
        }
      } else {
        try {
          const text = await response.text();
          addLog(`Response body (text): ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
          data = { text };
        } catch (err) {
          addLog(`❌ Error reading response text: ${err instanceof Error ? err.message : String(err)}`);
          data = { error: 'Failed to read response text' };
        }
      }
      
      // Check for specific success/error conditions
      if (response.ok) {
        addLog('✅ API request successful');
        
        if (data && data.roadmap) {
          addLog(`Roadmap data received: ID=${data.roadmap.id}`);
          addLog(`Candidate ID in roadmap: ${data.roadmap.candidateId}`);
          addLog(`Milestones count: ${data.roadmap.milestones?.length || 0}`);
        } else {
          addLog('⚠️ API response OK but no roadmap data found');
        }
      } else {
        addLog(`❌ API request failed with status ${response.status}`);
        
        if (data && data.error) {
          addLog(`Error message: ${data.error}`);
          
          if (data.details) {
            addLog(`Error details: ${JSON.stringify(data.details)}`);
          }
        }
        
        // Specific error handling based on status code
        if (response.status === 401) {
          addLog('🔑 Authentication error: The request is not authenticated');
          addLog('Possible causes:');
          addLog('- Session cookie is missing or invalid');
          addLog('- Token validation failed');
        } else if (response.status === 403) {
          addLog('🚫 Authorization error: The user does not have permission');
          addLog('Possible causes:');
          addLog('- User role claim is missing');
          addLog('- User is not a recruiter or owner of the roadmap');
          addLog('- Firestore security rules are blocking access');
        } else if (response.status === 404) {
          addLog('📭 Not found error: The roadmap does not exist');
          addLog('Possible causes:');
          addLog('- Candidate ID is incorrect');
          addLog('- Roadmap has not been generated for this candidate');
        } else if (response.status === 500) {
          addLog('⚠️ Server error: Something went wrong on the server');
          addLog('Possible causes:');
          addLog('- Firebase Admin SDK initialization failed');
          addLog('- Firestore query error');
          addLog('- Token validation error');
        }
      }
      
      // Store the complete response data
      setApiResponse({
        url: `/api/roadmaps/${candidateId}`,
        status: response.status,
        statusText: response.statusText,
        headers,
        data,
        timing: {
          requestTime: startTime,
          responseTime: endTime,
          duration: endTime - startTime
        }
      });
      
    } catch (error) {
      addLog(`❌ Network error: ${error instanceof Error ? error.message : String(error)}`);
      setApiResponse({
        error: String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">API Access Test</h1>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="font-bold mb-2">Test Configuration</h2>
        <div className="flex items-center mb-4">
          <label className="mr-2 font-semibold">Candidate ID:</label>
          <input
            type="text"
            value={candidateId}
            onChange={(e) => setCandidateId(e.target.value)}
            className="border rounded px-2 py-1 flex-grow"
          />
        </div>
        <button
          onClick={testRoadmapApi}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Roadmap API'}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-bold">Debug Logs</h2>
            <button 
              onClick={clearLogs}
              className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
            >
              Clear
            </button>
          </div>
          <div className="bg-black text-green-400 p-4 rounded h-96 overflow-auto font-mono text-sm">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))
            ) : (
              <div className="text-gray-500">No logs yet. Run a test to see results.</div>
            )}
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-bold mb-2">API Response</h2>
          <div className="bg-white border p-4 rounded h-96 overflow-auto">
            {apiResponse ? (
              <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(apiResponse, null, 2)}</pre>
            ) : (
              <div className="text-gray-500">No response data yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 