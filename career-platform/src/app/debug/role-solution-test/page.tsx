'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user';
import { normalizeRole, isDevelopmentMode } from '@/utils/environment';
import Link from 'next/link';

interface RoleTestResult {
  original: string;
  normalized: string;
  matchesEnum: boolean;
  test?: string;
}

export default function RoleSolutionTestPage() {
  const { userProfile, currentUser } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [candidateId, setCandidateId] = useState<string>('');
  const [candidates, setCandidates] = useState<any[]>([]);
  
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };
  
  // Fetch candidate list
  useEffect(() => {
    if (!userProfile) return;
    
    const fetchCandidates = async () => {
      try {
        addLog('Fetching candidate list...');
        const response = await fetch('/api/users/candidates');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch candidates: ${response.status}`);
        }
        
        const data = await response.json();
        setCandidates(data.candidates || []);
        addLog(`Found ${data.candidates?.length || 0} candidates`);
      } catch (error) {
        addLog(`Error fetching candidates: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
    
    fetchCandidates();
  }, [userProfile]);
  
  // Run all tests
  const runAllTests = async () => {
    setLoading(true);
    setTestResults([]);
    addLog('Starting comprehensive role solution tests...');
    
    try {
      // 1. Test role normalization
      await testRoleNormalization();
      
      // 2. Test token verification
      await testTokenVerification();
      
      // 3. Test roadmap access
      if (candidateId) {
        await testRoadmapAccess(candidateId);
      } else if (candidates.length > 0) {
        await testRoadmapAccess(candidates[0].uid);
      } else {
        addLog('No candidate ID available for roadmap access test');
      }
      
      addLog('All tests completed');
    } catch (error) {
      addLog(`Error running tests: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Test role normalization
  const testRoleNormalization = async () => {
    addLog('Testing role normalization...');
    
    const testRoles = [
      'recruiter',
      'RECRUITER',
      'Recruiter',
      UserRole.RECRUITER
    ];
    
    const results: RoleTestResult[] = testRoles.map(role => {
      const normalized = normalizeRole(role);
      const matchesEnum = normalized === normalizeRole(UserRole.RECRUITER);
      
      addLog(`Role "${role}" normalizes to "${normalized}" - Matches enum: ${matchesEnum}`);
      
      return {
        original: role,
        normalized,
        matchesEnum
      };
    });
    
    // Current user role check
    if (userProfile?.role) {
      const userRoleNormalized = normalizeRole(userProfile.role);
      const userRoleMatchesEnum = userRoleNormalized === normalizeRole(UserRole.RECRUITER);
      
      addLog(`Current user role: "${userProfile.role}" normalizes to "${userRoleNormalized}"`);
      addLog(`Current user is recruiter (direct): ${userProfile.role === UserRole.RECRUITER}`);
      addLog(`Current user is recruiter (normalized): ${userRoleMatchesEnum}`);
      
      results.push({
        test: 'Current User Role',
        original: userProfile.role,
        normalized: userRoleNormalized,
        matchesEnum: userRoleMatchesEnum
      });
    }
    
    setTestResults(prev => [...prev, {
      name: 'Role Normalization',
      passed: results.some(r => r.matchesEnum),
      details: results
    }]);
    
    return results;
  };
  
  // Test token verification
  const testTokenVerification = async () => {
    addLog('Testing token verification...');
    
    try {
      if (!currentUser) {
        throw new Error('No user logged in');
      }
      
      // Get a fresh token
      const token = await currentUser.getIdToken(true);
      addLog(`Got fresh token, length: ${token.length}`);
      
      // Verify the token through our API
      const response = await fetch('/api/auth/verify-token');
      
      if (!response.ok) {
        throw new Error(`Token verification failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      addLog(`Token verified successfully`);
      addLog(`User ID: ${data.decodedToken?.uid}`);
      addLog(`Role: ${data.decodedToken?.role}`);
      
      const isRecruiterDirect = data.decodedToken?.role === UserRole.RECRUITER;
      const isRecruiterNormalized = normalizeRole(data.decodedToken?.role) === normalizeRole(UserRole.RECRUITER);
      
      addLog(`Is recruiter (direct): ${isRecruiterDirect}`);
      addLog(`Is recruiter (normalized): ${isRecruiterNormalized}`);
      
      setTestResults(prev => [...prev, {
        name: 'Token Verification',
        passed: response.ok,
        details: {
          validationMethod: data.validationMethod,
          role: data.decodedToken?.role,
          isRecruiterDirect,
          isRecruiterNormalized
        }
      }]);
      
      return data;
    } catch (error) {
      addLog(`Error verifying token: ${error instanceof Error ? error.message : String(error)}`);
      
      setTestResults(prev => [...prev, {
        name: 'Token Verification',
        passed: false,
        error: error instanceof Error ? error.message : String(error)
      }]);
      
      throw error;
    }
  };
  
  // Test roadmap access
  const testRoadmapAccess = async (testCandidateId: string) => {
    addLog(`Testing roadmap access for candidate: ${testCandidateId}`);
    
    try {
      // Try to access the roadmap
      const response = await fetch(`/api/roadmaps/${testCandidateId}`, {
        headers: {
          'X-Debug-Mode': 'true'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        addLog(`Roadmap access failed: ${response.status} - ${data.error}`);
        
        setTestResults(prev => [...prev, {
          name: 'Roadmap Access',
          passed: false,
          details: {
            status: response.status,
            error: data.error,
            details: data.details,
            debug: data.debug
          }
        }]);
        
        return;
      }
      
      addLog(`Roadmap access successful`);
      addLog(`Access reason: ${data.debug?.user?.accessReason || 'Unknown'}`);
      
      setTestResults(prev => [...prev, {
        name: 'Roadmap Access',
        passed: true,
        details: {
          accessReason: data.debug?.user?.accessReason,
          role: data.debug?.user?.role,
          environment: data.debug?.environment
        }
      }]);
      
      return data;
    } catch (error) {
      addLog(`Error accessing roadmap: ${error instanceof Error ? error.message : String(error)}`);
      
      setTestResults(prev => [...prev, {
        name: 'Roadmap Access',
        passed: false,
        error: error instanceof Error ? error.message : String(error)
      }]);
    }
  };
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Role Solution Test Page</h1>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="font-bold mb-2">Environment</h2>
        <p><span className="font-semibold">Development Mode:</span> {isDevelopmentMode() ? 'YES' : 'NO'}</p>
        <p><span className="font-semibold">NODE_ENV:</span> {process.env.NODE_ENV}</p>
        <p><span className="font-semibold">NEXT_PUBLIC_DEVELOPMENT_MODE:</span> {process.env.NEXT_PUBLIC_DEVELOPMENT_MODE}</p>
      </div>
      
      <div className="bg-green-50 p-4 rounded-lg mb-6">
        <h2 className="font-bold mb-2">Current User</h2>
        {userProfile ? (
          <div>
            <p><span className="font-semibold">Name:</span> {userProfile.displayName}</p>
            <p><span className="font-semibold">Email:</span> {userProfile.email}</p>
            <p><span className="font-semibold">Role:</span> {userProfile.role}</p>
            <p><span className="font-semibold">Is Recruiter (direct):</span> {userProfile.role === UserRole.RECRUITER ? 'YES' : 'NO'}</p>
            <p><span className="font-semibold">Is Recruiter (normalized):</span> {normalizeRole(userProfile.role) === normalizeRole(UserRole.RECRUITER) ? 'YES' : 'NO'}</p>
          </div>
        ) : (
          <p className="text-red-500">Not logged in</p>
        )}
      </div>
      
      <div className="mb-6">
        <h2 className="font-bold mb-2">Test Configuration</h2>
        <div className="flex items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Candidate ID for Testing
            </label>
            <select
              value={candidateId}
              onChange={(e) => setCandidateId(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 w-64"
            >
              <option value="">Select a candidate</option>
              {candidates.map(candidate => (
                <option key={candidate.uid} value={candidate.uid}>
                  {candidate.displayName} ({candidate.email})
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={runAllTests}
            disabled={loading || !userProfile}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
          >
            {loading ? 'Running Tests...' : 'Run All Tests'}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-3">Test Results</h3>
          {testResults.length === 0 ? (
            <p className="text-gray-500">No tests run yet</p>
          ) : (
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded ${result.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-lg ${result.passed ? 'text-green-500' : 'text-red-500'}`}>
                      {result.passed ? '✓' : '✗'}
                    </span>
                    <h4 className="font-medium">{result.name}</h4>
                  </div>
                  
                  <div className="mt-2 text-sm">
                    <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-40">
                      {JSON.stringify(result.details || result.error || {}, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-3">Logs</h3>
          <div className="bg-gray-100 p-2 rounded h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500 p-2">No logs yet</p>
            ) : (
              <ul className="space-y-1 text-xs font-mono">
                {logs.map((log, index) => (
                  <li key={index} className="border-b border-gray-200 pb-1">{log}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <h3 className="font-bold text-lg mb-3">Other Debug Tools</h3>
        <ul className="space-y-2">
          <li>
            <Link href="/debug/role-normalization" className="text-blue-500 hover:underline">
              Role Normalization Debug Tool
            </Link>
          </li>
          <li>
            <Link href="/debug/roadmap-access" className="text-blue-500 hover:underline">
              Roadmap Access Debug Tool
            </Link>
          </li>
          <li>
            <Link href="/api/auth/normalize-all-roles" className="text-blue-500 hover:underline">
              Run Role Normalization API (POST)
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
} 