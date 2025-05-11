'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, doc, getDoc, where, limit } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { CareerRoadmap } from '@/types/user';

export default function DirectRoadmapTest() {
  const { userProfile, currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState<CareerRoadmap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Helper function to add logs
  const addLog = (message: string) => {
    console.log(`[DIRECT-ROADMAP-TEST] ${message}`);
    setLogs(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };
  
  useEffect(() => {
    // Log initial auth status
    addLog(`User authenticated: ${!!currentUser}`);
    addLog(`User profile loaded: ${!!userProfile}`);
    if (userProfile) {
      addLog(`User role: ${userProfile.role}`);
    }
    
    // Function to fetch all roadmaps
    async function fetchRoadmaps() {
      try {
        // First get auth token (forces refresh)
        if (currentUser) {
          try {
            const token = await currentUser.getIdToken(true);
            addLog(`Successfully got fresh ID token (length: ${token.length})`);
          } catch (tokenErr) {
            addLog(`Error refreshing token: ${tokenErr instanceof Error ? tokenErr.message : 'Unknown error'}`);
          }
        }
        
        addLog('Querying all roadmaps collection...');
        const roadmapsQuery = query(collection(db, 'roadmaps'), limit(10));
        
        // Attempt to get all roadmaps
        try {
          const roadmapsSnapshot = await getDocs(roadmapsQuery);
          addLog(`Query successful! Found ${roadmapsSnapshot.size} roadmaps`);
          
          // Store basic info about each roadmap
          const roadmapList = roadmapsSnapshot.docs.map(doc => ({
            id: doc.id,
            candidateId: doc.data().candidateId,
            timestamp: doc.data().createdAt?.toDate?.() || 'no timestamp',
            milestoneCount: doc.data().milestones?.length || 0
          }));
          
          setRoadmaps(roadmapList);
          
          if (roadmapList.length > 0) {
            addLog(`First roadmap ID: ${roadmapList[0].id}`);
            addLog(`First roadmap candidateId: ${roadmapList[0].candidateId}`);
          }
        } catch (queryError: any) {
          addLog(`❌ Error querying roadmaps: ${queryError.message || 'Unknown error'}`);
          addLog(`Error code: ${queryError.code || 'No code'}`);
          setError(`Failed to query roadmaps: ${queryError.message}`);
        }
        
      } catch (err: any) {
        addLog(`❌ Unexpected error: ${err.message || 'Unknown error'}`);
        setError(`Unexpected error: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    }
    
    fetchRoadmaps();
  }, [currentUser, userProfile]);
  
  // Function to load a specific roadmap by ID
  const loadRoadmap = async (roadmapId: string) => {
    addLog(`Loading specific roadmap with ID: ${roadmapId}`);
    setLoading(true);
    
    try {
      const roadmapDocRef = doc(db, 'roadmaps', roadmapId);
      const roadmapSnapshot = await getDoc(roadmapDocRef);
      
      if (roadmapSnapshot.exists()) {
        addLog('✅ Successfully retrieved roadmap document');
        
        const roadmapData = roadmapSnapshot.data();
        addLog(`Roadmap data fields: ${Object.keys(roadmapData).join(', ')}`);
        addLog(`Milestones exist: ${!!roadmapData.milestones}`);
        
        if (roadmapData.milestones) {
          addLog(`Milestone count: ${roadmapData.milestones.length}`);
          
          if (roadmapData.milestones.length > 0) {
            const firstMilestone = roadmapData.milestones[0];
            addLog(`First milestone fields: ${Object.keys(firstMilestone).join(', ')}`);
          }
        }
        
        // Process the roadmap like our regular page does
        try {
          // Process milestones
          const formattedMilestones = roadmapData.milestones ? roadmapData.milestones.map((milestone: any) => ({
            ...milestone,
            id: milestone.id || `milestone-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: milestone.createdAt instanceof Date ? 
                  milestone.createdAt : 
                  (milestone.createdAt?.toDate ? milestone.createdAt.toDate() : new Date())
          })) : [];
          
          addLog(`✅ Successfully processed ${formattedMilestones.length} milestones`);
          
          // Create final roadmap object
          const processedRoadmap = {
            ...roadmapData,
            id: roadmapSnapshot.id,
            milestones: formattedMilestones,
            createdAt: roadmapData.createdAt?.toDate?.() || new Date(),
            updatedAt: roadmapData.updatedAt?.toDate?.() || new Date()
          };
          
          setSelectedRoadmap(processedRoadmap as CareerRoadmap);
          addLog('✅ Roadmap processing complete');
          
          // Stringify a sample of the roadmap to verify structure
          try {
            const sampleJson = JSON.stringify({
              id: processedRoadmap.id,
              milestoneCount: processedRoadmap.milestones.length,
              firstMilestoneTitle: processedRoadmap.milestones[0]?.title || 'None'
            });
            addLog(`Roadmap sample: ${sampleJson}`);
          } catch (jsonErr) {
            addLog(`Error stringifying roadmap: ${jsonErr instanceof Error ? jsonErr.message : 'Unknown error'}`);
          }
        } catch (processingErr) {
          addLog(`❌ Error processing roadmap: ${processingErr instanceof Error ? processingErr.message : 'Unknown error'}`);
          setError(`Error processing roadmap: ${processingErr instanceof Error ? processingErr.message : 'Unknown error'}`);
        }
      } else {
        addLog('❌ Roadmap document not found');
        setError('Roadmap not found');
      }
    } catch (err: any) {
      addLog(`❌ Error loading roadmap: ${err.message || 'Unknown error'}`);
      addLog(`Error code: ${err.code || 'No code'}`);
      setError(`Error loading roadmap: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to test candidate query
  const testCandidateQuery = async (candidateId: string) => {
    addLog(`Testing roadmap query for candidate ID: ${candidateId}`);
    setLoading(true);
    
    try {
      const candidateQuery = query(
        collection(db, 'roadmaps'),
        where('candidateId', '==', candidateId)
      );
      
      const querySnapshot = await getDocs(candidateQuery);
      
      if (querySnapshot.empty) {
        addLog('❌ No roadmaps found for this candidate');
        setError('No roadmaps found for candidate');
      } else {
        addLog(`✅ Found ${querySnapshot.size} roadmap(s) for this candidate`);
        
        // Get the first roadmap
        const roadmapId = querySnapshot.docs[0].id;
        addLog(`Loading roadmap ID: ${roadmapId}`);
        
        // Use the existing function to load the details
        await loadRoadmap(roadmapId);
      }
    } catch (err: any) {
      addLog(`❌ Error querying for candidate: ${err.message || 'Unknown error'}`);
      addLog(`Error code: ${err.code || 'No code'}`);
      setError(`Error querying for candidate: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Render the debug UI
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Direct Roadmap Test</h1>
      
      {/* Authentication status */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Authentication Status</h2>
        <div>
          <p><strong>User authenticated:</strong> {currentUser ? '✅' : '❌'}</p>
          <p><strong>User profile:</strong> {userProfile ? '✅' : '❌'}</p>
          {userProfile && (
            <p><strong>Role:</strong> {userProfile.role}</p>
          )}
        </div>
      </div>
      
      {/* Error display */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
          <h2 className="font-semibold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      )}
      
      {/* Available roadmaps */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Available Roadmaps</h2>
        
        {loading ? (
          <div className="p-4 bg-blue-50 rounded-lg">Loading roadmaps...</div>
        ) : roadmaps.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Candidate ID</th>
                  <th className="px-4 py-2 text-left">Milestones</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roadmaps.map((roadmap) => (
                  <tr key={roadmap.id} className="border-t border-gray-200">
                    <td className="px-4 py-2 font-mono text-sm">{roadmap.id}</td>
                    <td className="px-4 py-2 font-mono text-sm">{roadmap.candidateId}</td>
                    <td className="px-4 py-2">{roadmap.milestoneCount}</td>
                    <td className="px-4 py-2">
                      <button 
                        onClick={() => loadRoadmap(roadmap.id)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Load
                      </button>
                      <button 
                        onClick={() => testCandidateQuery(roadmap.candidateId)}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm ml-2"
                      >
                        Query by Candidate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 bg-yellow-50 rounded-lg">No roadmaps found or error loading roadmaps</div>
        )}
      </div>
      
      {/* Selected roadmap display */}
      {selectedRoadmap && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Selected Roadmap</h2>
          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <div className="mb-4">
              <p><strong>ID:</strong> {selectedRoadmap.id}</p>
              <p><strong>Candidate ID:</strong> {selectedRoadmap.candidateId}</p>
              <p><strong>Created:</strong> {selectedRoadmap.createdAt.toLocaleString()}</p>
              <p><strong>Milestones:</strong> {selectedRoadmap.milestones.length}</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Milestones</h3>
              {selectedRoadmap.milestones.length > 0 ? (
                <div className="space-y-4">
                  {selectedRoadmap.milestones.map((milestone: any) => (
                    <div key={milestone.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                      <p><strong>{milestone.title}</strong> - {milestone.timeframe}</p>
                      <p className="text-sm mt-1">{milestone.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="italic text-gray-500">No milestones found</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Debug logs */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Debug Logs</h2>
        <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-96">
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
} 