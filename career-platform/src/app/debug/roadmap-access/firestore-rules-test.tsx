'use client';

import React, { useState } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user';

export default function FirestoreRulesTest() {
  const { userProfile, currentUser } = useAuth();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Test specifically for the isRecruiter() function in Firestore rules
  const testRecruiterFunction = async () => {
    if (!currentUser || !userProfile) {
      setError('You must be logged in to test Firestore rules');
      return;
    }
    
    setLoading(true);
    setError(null);
    const testResults: any[] = [];
    
    try {
      // Log detailed user role information
      console.log('User role debug information:');
      console.log(`- Role from userProfile: "${userProfile.role}"`);
      console.log(`- Role type: ${typeof userProfile.role}`);
      console.log(`- Is equal to UserRole.RECRUITER: ${userProfile.role === UserRole.RECRUITER}`);
      console.log(`- UserRole.RECRUITER value: "${UserRole.RECRUITER}"`);
      
      // Get the raw user document from Firestore to check the actual stored value
      const userDocRef = doc(db, 'users', userProfile.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const rawRole = userDocSnap.data().role;
        console.log(`- Raw role from Firestore: "${rawRole}"`);
        console.log(`- Raw role type: ${typeof rawRole}`);
        testResults.push({
          name: 'User Role Check',
          passed: rawRole === UserRole.RECRUITER,
          details: {
            roleInUserProfile: userProfile.role,
            roleInFirestore: rawRole,
            expectedRole: UserRole.RECRUITER,
            isMatch: rawRole === UserRole.RECRUITER
          }
        });
      }
      
      // 1. First get a fresh token
      const token = await currentUser.getIdToken(true);
      console.log(`Got fresh token, length: ${token.length}`);
      
      // 2. Test access to users collection (should work for recruiters)
      try {
        const usersQuery = query(collection(db, 'users'), where('role', '==', 'candidate'));
        const usersSnapshot = await getDocs(usersQuery);
        
        testResults.push({
          name: 'Query Users Collection',
          passed: true,
          details: {
            count: usersSnapshot.size,
            rule: 'isRecruiter() should allow this'
          }
        });
      } catch (err: any) {
        testResults.push({
          name: 'Query Users Collection',
          passed: false,
          error: err.message,
          code: err.code,
          details: {
            rule: 'isRecruiter() should allow this'
          }
        });
      }
      
      // 3. Test access to roadmaps collection (the problematic one)
      try {
        const roadmapsQuery = query(collection(db, 'roadmaps'));
        const roadmapsSnapshot = await getDocs(roadmapsQuery);
        
        testResults.push({
          name: 'Query All Roadmaps',
          passed: true,
          details: {
            count: roadmapsSnapshot.size,
            rule: 'isRecruiter() or isOwner() should allow this'
          }
        });
        
        // If we can access the collection, try to get one document
        if (!roadmapsSnapshot.empty) {
          const roadmapDoc = roadmapsSnapshot.docs[0];
          const roadmapId = roadmapDoc.id;
          const candidateId = roadmapDoc.data().candidateId;
          
          testResults.push({
            name: 'Sample Roadmap Document',
            passed: true,
            details: {
              roadmapId,
              candidateId,
              rule: 'Direct document access worked'
            }
          });
          
          // Now try to query specifically for this candidate's roadmap
          try {
            const specificQuery = query(
              collection(db, 'roadmaps'),
              where('candidateId', '==', candidateId)
            );
            const specificSnapshot = await getDocs(specificQuery);
            
            testResults.push({
              name: `Query Roadmap for Candidate ${candidateId}`,
              passed: true,
              details: {
                count: specificSnapshot.size,
                rule: 'isRecruiter() or isOwner() should allow this'
              }
            });
          } catch (err: any) {
            testResults.push({
              name: `Query Roadmap for Candidate ${candidateId}`,
              passed: false,
              error: err.message,
              code: err.code,
              details: {
                candidateId,
                rule: 'isRecruiter() or isOwner() should allow this'
              }
            });
          }
        }
      } catch (err: any) {
        testResults.push({
          name: 'Query All Roadmaps',
          passed: false,
          error: err.message,
          code: err.code,
          details: {
            rule: 'isRecruiter() or isOwner() should allow this'
          }
        });
      }
      
      // 4. Test the isRecruiter() function directly
      // This is a special test that tries to determine if the function is evaluating correctly
      try {
        // Try to access a document that should only be accessible if isRecruiter() is true
        const testDoc = await getDoc(doc(db, 'recruiter_only_test', 'test_doc'));
        
        testResults.push({
          name: 'Recruiter-Only Test Document',
          passed: testDoc.exists(),
          details: {
            exists: testDoc.exists(),
            rule: 'Only accessible if isRecruiter() evaluates to true'
          }
        });
      } catch (err: any) {
        // If we get "permission-denied", the function is evaluating but returning false
        // If we get "not-found", the document doesn't exist but the function might be working
        const isPossiblyWorking = err.code === 'not-found';
        
        testResults.push({
          name: 'Recruiter-Only Test Document',
          passed: isPossiblyWorking,
          error: err.message,
          code: err.code,
          details: {
            rule: 'Only accessible if isRecruiter() evaluates to true',
            interpretation: isPossiblyWorking 
              ? 'Document not found, but permission check might be working' 
              : 'Permission denied - isRecruiter() is likely returning false'
          }
        });
      }
      
      setResults(testResults);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mt-8">
      <h2 className="text-xl font-bold mb-4">Firestore Rules Test</h2>
      <p className="mb-4 text-gray-600">
        This tool specifically tests the Firestore security rules for roadmap access.
        It will help determine if the <code>isRecruiter()</code> function in the rules is working correctly.
      </p>
      
      <button
        onClick={testRecruiterFunction}
        disabled={loading || !userProfile}
        className={`px-4 py-2 rounded ${
          loading || !userProfile 
            ? 'bg-gray-300 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {loading ? 'Testing...' : 'Test Recruiter Function'}
      </button>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}
      
      {results.length > 0 && (
        <div className="mt-6">
          <h3 className="font-bold mb-2">Test Results:</h3>
          <div className="space-y-4">
            {results.map((result, index) => (
              <div 
                key={index} 
                className={`p-3 rounded ${
                  result.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${result.passed ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <h4 className="font-bold">{result.name}</h4>
                </div>
                
                {result.error && (
                  <div className="mt-2 text-red-700 text-sm">
                    Error: {result.error} {result.code ? `(${result.code})` : ''}
                  </div>
                )}
                
                <div className="mt-2 text-sm">
                  <pre className="bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 