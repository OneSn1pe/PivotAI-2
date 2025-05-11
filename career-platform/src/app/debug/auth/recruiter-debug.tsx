'use client';

import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user';

export default function RecruiterDebugPage() {
  const { userProfile, currentUser } = useAuth();
  const [candidateId, setCandidateId] = useState('');
  const [results, setResults] = useState<any>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProd, setIsProd] = useState(process.env.NODE_ENV === 'production');
  const [isDev, setIsDev] = useState(process.env.NEXT_PUBLIC_DEVELOPMENT_MODE === 'true');
  
  const testRecruiterAccess = async () => {
    if (!candidateId) {
      setError('Please enter a candidate ID');
      return;
    }
    
    setResults([]);
    setError(null);
    
    try {
      // Log environment info
      const testResults = [];
      testResults.push({
        test: 'Environment',
        result: {
          isProd: process.env.NODE_ENV === 'production',
          isDev: process.env.NEXT_PUBLIC_DEVELOPMENT_MODE === 'true',
          hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
        }
      });
      
      // Test 1: Check user auth
      testResults.push({
        test: 'Auth Check',
        result: {
          isLoggedIn: !!currentUser,
          uid: currentUser?.uid || 'none',
          userProfile: userProfile ? {
            uid: userProfile.uid,
            role: userProfile.role,
            isRecruiter: userProfile.role === UserRole.RECRUITER
          } : 'none',
          tokenLength: await currentUser?.getIdToken().then(t => t.length) || 0
        }
      });
      
      // Test 2: Access candidate profile directly
      try {
        const candidateDocRef = doc(db, 'users', candidateId);
        const candidateDocSnap = await getDoc(candidateDocRef);
        
        testResults.push({
          test: 'Candidate Profile Access',
          result: {
            success: candidateDocSnap.exists(),
            data: candidateDocSnap.exists() ? {
              displayName: candidateDocSnap.data().displayName,
              role: candidateDocSnap.data().role
            } : 'not found'
          }
        });
      } catch (err: any) {
        testResults.push({
          test: 'Candidate Profile Access',
          result: {
            success: false,
            error: err.message || 'Unknown error',
            code: err.code || 'no code'
          }
        });
      }
      
      // Test 3: Access roadmap
      try {
        const roadmapQuery = query(
          collection(db, 'roadmaps'),
          where('candidateId', '==', candidateId)
        );
        
        const roadmapSnapshot = await getDocs(roadmapQuery);
        
        testResults.push({
          test: 'Roadmap Access',
          result: {
            success: !roadmapSnapshot.empty,
            count: roadmapSnapshot.size,
            data: !roadmapSnapshot.empty ? {
              id: roadmapSnapshot.docs[0].id,
              milestoneCount: roadmapSnapshot.docs[0].data().milestones?.length || 0
            } : 'not found'
          }
        });
      } catch (err: any) {
        testResults.push({
          test: 'Roadmap Access',
          result: {
            success: false,
            error: err.message || 'Unknown error',
            code: err.code || 'no code'
          }
        });
      }
      
      // Test 4: Check session cookie
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      
      testResults.push({
        test: 'Session Cookie',
        result: {
          exists: !!cookies['session'],
          length: cookies['session']?.length || 0,
          allCookies: Object.keys(cookies)
        }
      });
      
      setResults(testResults);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
    }
  };
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Recruiter Access Debug Tool</h1>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="font-bold mb-2">Environment</h2>
        <p><span className="font-semibold">Production Mode:</span> {isProd ? 'YES' : 'NO'}</p>
        <p><span className="font-semibold">Development Mode:</span> {isDev ? 'YES' : 'NO'}</p>
        <p><span className="font-semibold">Hostname:</span> {typeof window !== 'undefined' ? window.location.hostname : 'unknown'}</p>
      </div>
      
      <div className="bg-green-50 p-4 rounded-lg mb-6">
        <h2 className="font-bold mb-2">Current User</h2>
        {userProfile ? (
          <div>
            <p><span className="font-semibold">Name:</span> {userProfile.displayName}</p>
            <p><span className="font-semibold">Role:</span> {userProfile.role}</p>
            <p><span className="font-semibold">Is Recruiter:</span> {userProfile.role === UserRole.RECRUITER ? 'YES' : 'NO'}</p>
          </div>
        ) : (
          <p className="text-red-500">Not logged in</p>
        )}
      </div>
      
      <div className="flex flex-col mb-6">
        <label className="font-semibold mb-2">Candidate ID to Test:</label>
        <input 
          type="text" 
          value={candidateId}
          onChange={(e) => setCandidateId(e.target.value)}
          className="border p-2 rounded mb-2"
          placeholder="Enter candidate ID"
        />
        <button 
          onClick={testRecruiterAccess}
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Test Access
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 p-4 rounded-lg mb-6">
          <h2 className="font-bold mb-2 text-red-700">Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      {results.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-bold mb-4">Test Results</h2>
          
          {results.map((result: any, index: number) => (
            <div key={index} className="mb-4 border-b pb-4">
              <h3 className="font-bold">{result.test}</h3>
              <pre className="bg-gray-100 p-2 rounded mt-2 overflow-auto">
                {JSON.stringify(result.result, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 