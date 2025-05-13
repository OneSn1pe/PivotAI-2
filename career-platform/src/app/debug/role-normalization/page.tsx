'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user';
import { normalizeRole } from '@/utils/environment';

export default function RoleNormalizationDebug() {
  const { userProfile, currentUser } = useAuth();
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Test role normalization
  const testRoleNormalization = () => {
    const testRoles = [
      'recruiter',
      'RECRUITER',
      'Recruiter',
      'candidate',
      'CANDIDATE',
      'Candidate',
      UserRole.RECRUITER,
      UserRole.CANDIDATE
    ];
    
    const normalizedResults = testRoles.map(role => ({
      original: role,
      normalized: normalizeRole(role),
      matchesRecruiter: normalizeRole(role) === normalizeRole(UserRole.RECRUITER),
      matchesCandidate: normalizeRole(role) === normalizeRole(UserRole.CANDIDATE),
      matchesEnum: role === UserRole.RECRUITER || role === UserRole.CANDIDATE
    }));
    
    setResults({
      normalizedResults,
      userRole: userProfile?.role,
      userRoleNormalized: normalizeRole(userProfile?.role),
      matchesRecruiterEnum: userProfile?.role === UserRole.RECRUITER,
      matchesRecruiterNormalized: normalizeRole(userProfile?.role) === normalizeRole(UserRole.RECRUITER),
      enumValues: {
        RECRUITER: UserRole.RECRUITER,
        CANDIDATE: UserRole.CANDIDATE
      }
    });
  };
  
  // Run normalization on all users
  const runNormalization = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/normalize-all-roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };
  
  // Refresh user token
  const refreshToken = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!currentUser) {
        throw new Error('No user logged in');
      }
      
      // Force token refresh
      await currentUser.getIdToken(true);
      
      setResults({
        message: 'Token refreshed successfully',
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Role Normalization Debug Tool</h1>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="font-bold mb-2">Current User</h2>
        {userProfile ? (
          <div>
            <p><span className="font-semibold">Name:</span> {userProfile.displayName}</p>
            <p><span className="font-semibold">Email:</span> {userProfile.email}</p>
            <p><span className="font-semibold">Role:</span> {userProfile.role}</p>
            <p><span className="font-semibold">Role Type:</span> {typeof userProfile.role}</p>
            <p><span className="font-semibold">Is Recruiter (direct comparison):</span> {userProfile.role === UserRole.RECRUITER ? 'YES' : 'NO'}</p>
            <p><span className="font-semibold">Is Recruiter (normalized):</span> {normalizeRole(userProfile.role) === normalizeRole(UserRole.RECRUITER) ? 'YES' : 'NO'}</p>
          </div>
        ) : (
          <p className="text-red-500">Not logged in</p>
        )}
      </div>
      
      <div className="flex flex-wrap gap-4 mb-6">
        <button 
          onClick={testRoleNormalization}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Test Role Normalization
        </button>
        
        <button 
          onClick={runNormalization}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {loading ? 'Running...' : 'Run Normalization on All Users'}
        </button>
        
        <button 
          onClick={refreshToken}
          disabled={loading || !currentUser}
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {loading ? 'Refreshing...' : 'Refresh User Token'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {results && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-3">Results</h3>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 