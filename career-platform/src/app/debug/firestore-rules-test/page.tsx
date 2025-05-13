'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/config/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

export default function FirestoreRulesTestPage() {
  const { userProfile, currentUser } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [candidateId, setCandidateId] = useState('0AZJyS2HH1OXTHdE6QvvzuPYmMA3'); // Default test candidate
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>({});

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toISOString().substring(11, 19)} - ${message}`]);
  };

  const clearLogs = () => {
    setLogs([]);
    setTestResults({});
  };

  // Test direct access to roadmaps collection
  const testRoadmapsAccess = async () => {
    clearLogs();
    setLoading(true);
    
    addLog('🔍 Testing Firestore rules for roadmaps collection...');
    
    // Log user information
    if (currentUser) {
      addLog(`User: ${currentUser.email} (${currentUser.uid})`);
      addLog(`Role: ${userProfile?.role || 'unknown'}`);
    } else {
      addLog('❌ No user logged in');
      setLoading(false);
      return;
    }
    
    const results: Record<string, any> = {};
    
    // Test 1: Try to query all roadmaps
    addLog('\n1️⃣ Testing query for all roadmaps');
    try {
      const allRoadmapsQuery = collection(db, 'roadmaps');
      const querySnapshot = await getDocs(allRoadmapsQuery);
      
      addLog(`✅ Query succeeded, found ${querySnapshot.size} roadmaps`);
      results.allRoadmapsQuery = {
        success: true,
        count: querySnapshot.size,
        firstDocId: querySnapshot.size > 0 ? querySnapshot.docs[0].id : null
      };
    } catch (error) {
      addLog(`❌ Query failed: ${error instanceof Error ? error.message : String(error)}`);
      results.allRoadmapsQuery = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
    
    // Test 2: Try to query roadmaps for specific candidate
    addLog(`\n2️⃣ Testing query for roadmap with candidateId: ${candidateId}`);
    try {
      const candidateRoadmapQuery = query(
        collection(db, 'roadmaps'),
        where('candidateId', '==', candidateId)
      );
      
      const querySnapshot = await getDocs(candidateRoadmapQuery);
      
      if (querySnapshot.empty) {
        addLog('⚠️ Query succeeded but no documents found');
        results.candidateRoadmapQuery = {
          success: true,
          found: false
        };
      } else {
        addLog(`✅ Query succeeded, found ${querySnapshot.size} roadmap(s)`);
        const roadmapId = querySnapshot.docs[0].id;
        addLog(`Roadmap ID: ${roadmapId}`);
        
        results.candidateRoadmapQuery = {
          success: true,
          found: true,
          count: querySnapshot.size,
          roadmapId
        };
        
        // Test 3: Try to get the roadmap document directly
        addLog(`\n3️⃣ Testing direct access to roadmap document: ${roadmapId}`);
        try {
          const roadmapDocRef = doc(db, 'roadmaps', roadmapId);
          const roadmapDoc = await getDoc(roadmapDocRef);
          
          if (roadmapDoc.exists()) {
            addLog('✅ Document access succeeded');
            const data = roadmapDoc.data();
            addLog(`Document data: candidateId=${data.candidateId}, milestones=${data.milestones?.length || 0}`);
            
            results.roadmapDocAccess = {
              success: true,
              exists: true,
              data: {
                candidateId: data.candidateId,
                milestonesCount: data.milestones?.length || 0
              }
            };
          } else {
            addLog('⚠️ Document does not exist');
            results.roadmapDocAccess = {
              success: true,
              exists: false
            };
          }
        } catch (error) {
          addLog(`❌ Document access failed: ${error instanceof Error ? error.message : String(error)}`);
          results.roadmapDocAccess = {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      }
    } catch (error) {
      addLog(`❌ Query failed: ${error instanceof Error ? error.message : String(error)}`);
      results.candidateRoadmapQuery = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
    
    // Test 4: Try to access a non-existent document (should succeed but return not found)
    const fakeId = 'nonexistent-roadmap-id-123456789';
    addLog(`\n4️⃣ Testing access to non-existent document: ${fakeId}`);
    try {
      const fakeDocRef = doc(db, 'roadmaps', fakeId);
      const fakeDoc = await getDoc(fakeDocRef);
      
      if (!fakeDoc.exists()) {
        addLog('✅ Access succeeded, document correctly reported as non-existent');
        results.nonExistentDoc = {
          success: true,
          exists: false
        };
      } else {
        addLog('⚠️ Unexpected: Document exists when it should not');
        results.nonExistentDoc = {
          success: true,
          exists: true
        };
      }
    } catch (error) {
      addLog(`❌ Access failed: ${error instanceof Error ? error.message : String(error)}`);
      results.nonExistentDoc = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
    
    // Set final results
    setTestResults({
      timestamp: new Date().toISOString(),
      user: {
        uid: currentUser.uid,
        email: currentUser.email,
        role: userProfile?.role
      },
      candidateId,
      tests: results
    });
    
    setLoading(false);
    addLog('\n✅ All tests completed');
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Firestore Rules Test</h1>
      
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
          onClick={testRoadmapsAccess}
          disabled={loading || !currentUser}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Roadmaps Access'}
        </button>
        
        {!currentUser && (
          <p className="mt-2 text-red-500">You must be logged in to run these tests.</p>
        )}
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
                <div key={index} className="whitespace-pre-wrap">{log}</div>
              ))
            ) : (
              <div className="text-gray-500">No logs yet. Run a test to see results.</div>
            )}
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-bold mb-2">Test Results</h2>
          <div className="bg-white border p-4 rounded h-96 overflow-auto">
            {Object.keys(testResults).length > 0 ? (
              <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(testResults, null, 2)}</pre>
            ) : (
              <div className="text-gray-500">No test results yet.</div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
        <h2 className="font-bold mb-2">Firestore Rules Information</h2>
        <p className="mb-2">This page tests the Firestore security rules for the roadmaps collection. The tests check:</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Querying all roadmaps (should succeed for recruiters, fail for candidates)</li>
          <li>Querying roadmaps for a specific candidate (should succeed for recruiters and the candidate owner)</li>
          <li>Direct access to a roadmap document (should succeed for recruiters and the candidate owner)</li>
          <li>Access to a non-existent document (should succeed but return not found)</li>
        </ol>
        <p className="mt-2 text-sm text-gray-600">
          Note: In development mode, security rules might be bypassed. These tests reflect the actual Firestore
          rules enforcement in your current environment.
        </p>
      </div>
    </div>
  );
} 