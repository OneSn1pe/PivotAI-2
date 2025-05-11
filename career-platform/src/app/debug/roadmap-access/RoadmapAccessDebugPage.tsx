'use client';

import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user';

export default function RoadmapAccessDebugPage() {
  const { userProfile, currentUser } = useAuth();
  const [candidateId, setCandidateId] = useState('');
  const [results, setResults] = useState<any>([]);
  const [detailedResults, setDetailedResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProd, setIsProd] = useState(process.env.NODE_ENV === 'production');
  const [isDev, setIsDev] = useState(process.env.NEXT_PUBLIC_DEVELOPMENT_MODE === 'true');
  
  // Method to directly test roadmap access without other factors
  const testRoadmapAccess = async () => {
    if (!candidateId) {
      setError('Please enter a candidate ID');
      return;
    }
    
    if (!currentUser) {
      setError('You must be logged in to test roadmap access');
      return;
    }
    
    setResults([]);
    setDetailedResults(null);
    setError(null);
    
    const diagnosticLog: string[] = [];
    diagnosticLog.push(`Starting roadmap access test for candidate ID: ${candidateId}`);
    
    try {
      // 1. Environment Information
      const envInfo = {
        isProd: process.env.NODE_ENV === 'production',
        isDev: process.env.NEXT_PUBLIC_DEVELOPMENT_MODE === 'true',
        hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
      };
      diagnosticLog.push(`Environment: ${JSON.stringify(envInfo)}`);
      
      // 2. Get fresh token 
      let token = '';
      try {
        token = await currentUser.getIdToken(true); // Force refresh
        diagnosticLog.push(`Successfully retrieved fresh ID token (${token.length} chars)`);
      } catch (err) {
        diagnosticLog.push(`Error refreshing token: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
      
      // 3. Set token in cookie
      if (token) {
        const isLocalDevelopment = typeof window !== 'undefined' && 
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        
        if (isLocalDevelopment) {
          document.cookie = `session=${token}; path=/; max-age=3600`;
        } else {
          document.cookie = `session=${token}; path=/; max-age=3600; secure; samesite=strict`;
        }
        diagnosticLog.push(`Set session cookie with fresh token`);
      }
      
      // 4. Test Firestore rules directly using recursive approach
      const testResults: any[] = [];
      
      // 4.1 First test - Verify user profile access
      diagnosticLog.push(`Testing user profile access for candidate ID: ${candidateId}`);
      try {
        const userDocRef = doc(db, 'users', candidateId);
        const userDocSnap = await getDoc(userDocRef);
        
        testResults.push({
          test: 'Candidate User Document Access',
          passed: userDocSnap.exists(),
          details: userDocSnap.exists() ? {
            userId: candidateId,
            role: userDocSnap.data().role,
            displayName: userDocSnap.data().displayName
          } : 'Document not found'
        });
        
        if (userDocSnap.exists()) {
          diagnosticLog.push(`✅ Successfully accessed candidate user document`);
        } else {
          diagnosticLog.push(`❌ Candidate user document not found`);
        }
      } catch (err: any) {
        diagnosticLog.push(`❌ Error accessing candidate user document: ${err.message}`);
        testResults.push({
          test: 'Candidate User Document Access',
          passed: false,
          error: err.message,
          code: err.code
        });
      }
      
      // 4.2 Second test - Query roadmaps collection for candidate
      diagnosticLog.push(`Testing roadmap collection query for candidate ID: ${candidateId}`);
      try {
        // First try with collection query
        const roadmapQuery = query(
          collection(db, 'roadmaps'),
          where('candidateId', '==', candidateId)
        );
        
        const roadmapQuerySnapshot = await getDocs(roadmapQuery);
        
        testResults.push({
          test: 'Roadmap Collection Query',
          passed: !roadmapQuerySnapshot.empty,
          details: {
            empty: roadmapQuerySnapshot.empty,
            size: roadmapQuerySnapshot.size,
            queryPath: `roadmaps where candidateId == ${candidateId}`
          }
        });
        
        if (!roadmapQuerySnapshot.empty) {
          diagnosticLog.push(`✅ Successfully queried roadmap collection (${roadmapQuerySnapshot.size} results)`);
          
          // Store IDs for direct document access test
          const roadmapIds = roadmapQuerySnapshot.docs.map(doc => doc.id);
          
          // Try direct document access for each roadmap
          for (const roadmapId of roadmapIds) {
            diagnosticLog.push(`Testing direct access to roadmap document ID: ${roadmapId}`);
            
            try {
              const roadmapDocRef = doc(db, 'roadmaps', roadmapId);
              const roadmapDocSnap = await getDoc(roadmapDocRef);
              
              testResults.push({
                test: `Direct Roadmap Document Access (ID: ${roadmapId})`,
                passed: roadmapDocSnap.exists(),
                details: roadmapDocSnap.exists() ? {
                  id: roadmapId,
                  candidateId: roadmapDocSnap.data().candidateId,
                  milestoneCount: roadmapDocSnap.data().milestones?.length || 0
                } : 'Document not found'
              });
              
              if (roadmapDocSnap.exists()) {
                diagnosticLog.push(`✅ Successfully accessed roadmap document directly`);
              } else {
                diagnosticLog.push(`❌ Roadmap document not found by direct access`);
              }
            } catch (err: any) {
              diagnosticLog.push(`❌ Error accessing roadmap document directly: ${err.message}`);
              testResults.push({
                test: `Direct Roadmap Document Access (ID: ${roadmapId})`,
                passed: false,
                error: err.message,
                code: err.code
              });
            }
          }
        } else {
          diagnosticLog.push(`❌ Roadmap collection query returned empty results`);
        }
      } catch (err: any) {
        diagnosticLog.push(`❌ Error querying roadmap collection: ${err.message}`);
        testResults.push({
          test: 'Roadmap Collection Query',
          passed: false,
          error: err.message,
          code: err.code
        });
      }
      
      // 4.3 Test Recursive Document Function (useful for diagnosing security rules)
      diagnosticLog.push(`Testing Firestore security rules through recursive document access`);
      const recursiveDocumentTest = async (path: string, depth: number = 0, maxDepth: number = 3) => {
        if (depth > maxDepth) return null;
        
        try {
          if (path.includes('/')) {
            // Document path
            const docRef = doc(db, path);
            const docSnap = await getDoc(docRef);
            
            return {
              path,
              exists: docSnap.exists(),
              type: 'document',
              data: docSnap.exists() ? {
                keys: Object.keys(docSnap.data()),
                previewData: JSON.stringify(docSnap.data()).substring(0, 100) + '...'
              } : null
            };
          } else {
            // Collection path
            const colRef = collection(db, path);
            const docsSnap = await getDocs(colRef);
            
            return {
              path,
              exists: !docsSnap.empty,
              type: 'collection',
              size: docsSnap.size,
              sampleDocs: docsSnap.empty ? [] : docsSnap.docs.slice(0, 3).map(d => d.id)
            };
          }
        } catch (err: any) {
          return {
            path,
            error: err.message,
            code: err.code
          };
        }
      };
      
      // Check roadmaps collection access
      const roadmapsColResult = await recursiveDocumentTest('roadmaps');
      testResults.push({
        test: 'Roadmaps Collection Access',
        details: roadmapsColResult
      });
      
      if (roadmapsColResult && !roadmapsColResult.error) {
        diagnosticLog.push(`✅ Successfully accessed roadmaps collection`);
      } else {
        diagnosticLog.push(`❌ Error accessing roadmaps collection: ${roadmapsColResult?.error || 'Unknown error'}`);
      }
      
      // 5. Test user role in Firestore rules
      diagnosticLog.push(`Testing if user is properly recognized as recruiter`);
      try {
        // We'll create a temporary document in a test collection to verify rule evaluation
        const testDocRef = doc(db, 'debug_tests', `role_test_${Date.now()}`);
        await setDoc(testDocRef, {
          testType: 'role_verification',
          timestamp: new Date(),
          userRole: userProfile?.role || 'none',
          isRecruiter: userProfile?.role === UserRole.RECRUITER
        });
        
        diagnosticLog.push(`✅ Successfully wrote test document - user has write access`);
        
        // Read it back
        const testDocSnap = await getDoc(testDocRef);
        
        testResults.push({
          test: 'Role Verification Test',
          passed: testDocSnap.exists(),
          details: testDocSnap.exists() ? testDocSnap.data() : 'Test document not found'
        });
        
        if (testDocSnap.exists()) {
          diagnosticLog.push(`✅ Successfully read test document - authentication is working`);
        } else {
          diagnosticLog.push(`❌ Test document not found - something is wrong with Firestore`);
        }
      } catch (err: any) {
        diagnosticLog.push(`❌ Error in role verification test: ${err.message}`);
        testResults.push({
          test: 'Role Verification Test',
          passed: false,
          error: err.message,
          code: err.code
        });
      }
      
      // 6. Check Firestore security rule evaluation
      const isRecruiterRole = userProfile?.role === UserRole.RECRUITER;
      diagnosticLog.push(`User role check: ${userProfile?.role} (isRecruiter: ${isRecruiterRole})`);
      diagnosticLog.push(`Firestore rule should check for: "recruiter" or "RECRUITER"`);
      
      // Set detailed results
      setDetailedResults({
        diagnosticLog,
        userProfile: userProfile ? {
          uid: userProfile.uid,
          email: userProfile.email,
          displayName: userProfile.displayName,
          role: userProfile.role,
          isRecruiter: userProfile.role === UserRole.RECRUITER
        } : 'No user profile',
        authState: {
          isAuthenticated: !!currentUser,
          tokenLength: token.length
        },
        candidateId
      });
      
      // Set test results
      setResults(testResults);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
      setDetailedResults({
        error: err.message,
        stack: err.stack,
        diagnosticLog
      });
    }
  };
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Roadmap Access Debug Tool</h1>
      <p className="text-gray-600 mb-6">This tool specifically tests access to candidate roadmaps and helps diagnose permission issues.</p>
      
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
            <p><span className="font-semibold">Email:</span> {userProfile.email}</p>
            <p><span className="font-semibold">Role:</span> {userProfile.role}</p>
            <p><span className="font-semibold">Is Recruiter:</span> {userProfile.role === UserRole.RECRUITER ? 'YES' : 'NO'}</p>
            <p><span className="font-semibold">UID:</span> {userProfile.uid}</p>
          </div>
        ) : (
          <p className="text-red-500">Not logged in</p>
        )}
      </div>
      
      <div className="flex flex-col mb-6">
        <label className="font-semibold mb-2">Candidate ID to Test Roadmap Access:</label>
        <input 
          type="text" 
          value={candidateId}
          onChange={(e) => setCandidateId(e.target.value)}
          className="border p-2 rounded mb-2"
          placeholder="Enter candidate ID"
        />
        <button 
          onClick={testRoadmapAccess}
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Test Roadmap Access
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 p-4 rounded-lg mb-6">
          <h2 className="font-bold mb-2 text-red-700">Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      {detailedResults && (
        <div className="bg-yellow-50 p-4 rounded-lg mb-6">
          <h2 className="font-bold mb-2">Diagnostic Log</h2>
          <div className="bg-yellow-100 p-3 rounded text-sm font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
            {detailedResults.diagnosticLog.map((log: string, index: number) => (
              <div key={index} className={`
                ${log.includes('❌') ? 'text-red-600' : ''}
                ${log.includes('✅') ? 'text-green-600' : ''}
              `}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {results.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-bold mb-4">Test Results</h2>
          
          {results.map((result: any, index: number) => (
            <div key={index} className={`mb-4 border-b pb-4 ${result.passed === false ? 'bg-red-50 p-3 rounded' : ''}`}>
              <h3 className="font-bold">{result.test}</h3>
              <div className="flex items-center mt-1 mb-2">
                <span 
                  className={`inline-block w-3 h-3 rounded-full mr-2 ${
                    result.passed === true ? 'bg-green-500' : 
                    result.passed === false ? 'bg-red-500' : 'bg-yellow-500'
                  }`}
                ></span>
                <span className={`text-sm ${
                  result.passed === true ? 'text-green-700' : 
                  result.passed === false ? 'text-red-700' : 'text-yellow-700'
                }`}>
                  {result.passed === true ? 'PASS' : 
                   result.passed === false ? 'FAIL' : 'INFO'}
                </span>
              </div>
              
              {result.error && (
                <div className="bg-red-100 p-2 rounded mb-2 text-red-700 text-sm">
                  Error: {result.error} {result.code ? `(${result.code})` : ''}
                </div>
              )}
              
              <pre className="bg-gray-100 p-2 rounded mt-2 overflow-auto text-xs">
                {JSON.stringify(result.details, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 