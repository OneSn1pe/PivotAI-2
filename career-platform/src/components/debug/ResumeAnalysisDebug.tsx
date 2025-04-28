import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { analyzeResume } from '@/services/openai';
import { useAuth } from '@/contexts/AuthContext';

interface DebugState {
  rawUserData: any;
  loading: boolean;
  error: string | null;
  activeTab: 'profile' | 'resume' | 'api';
  apiResponse: any;
  apiLoading: boolean;
  apiError: string | null;
  testResumeText: string;
}

const ResumeAnalysisDebug: React.FC = () => {
  const { userProfile } = useAuth();
  const [state, setState] = useState<DebugState>({
    rawUserData: null,
    loading: true,
    error: null,
    activeTab: 'profile',
    apiResponse: null,
    apiLoading: false,
    apiError: null,
    testResumeText: ''
  });

  useEffect(() => {
    async function fetchRawData() {
      if (!userProfile?.uid) return;
      
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        // Fetch user profile data from Firestore
        const userDocRef = doc(db, 'users', userProfile.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          throw new Error('User profile not found');
        }
        
        setState(prev => ({ 
          ...prev, 
          rawUserData: userDoc.data(),
          loading: false
        }));
        
        console.log('Fetched raw user data:', userDoc.data());
      } catch (error) {
        console.error('Error fetching raw data:', error);
        setState(prev => ({ 
          ...prev, 
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error fetching user data'
        }));
      }
    }
    
    fetchRawData();
  }, [userProfile?.uid]);

  const testAnalyzeApi = async () => {
    if (!state.testResumeText || state.testResumeText.trim().length === 0) {
      setState(prev => ({ 
        ...prev, 
        apiError: 'Please enter some resume text to analyze'
      }));
      return;
    }
    
    try {
      setState(prev => ({ 
        ...prev, 
        apiLoading: true, 
        apiError: null,
        apiResponse: null
      }));
      
      // Record start time for performance measurement
      const startTime = performance.now();
      
      // Call the API directly
      const result = await analyzeResume(state.testResumeText);
      
      // Record end time
      const endTime = performance.now();
      
      // Add processing time to result
      const resultWithTiming = {
        ...result,
        _debug: {
          ...(result as any)._debug,
          totalProcessingTime: Math.round(endTime - startTime)
        }
      };
      
      setState(prev => ({ 
        ...prev, 
        apiLoading: false,
        apiResponse: resultWithTiming
      }));
      
      console.log('API Test Result:', resultWithTiming);
    } catch (error) {
      console.error('API Test Error:', error);
      setState(prev => ({ 
        ...prev, 
        apiLoading: false,
        apiError: error instanceof Error ? error.message : 'Unknown error during API test'
      }));
    }
  };

  const formatJson = (data: any): string => {
    try {
      return JSON.stringify(data, null, 2);
    } catch (error) {
      return 'Error formatting JSON';
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Resume Analysis Debugger</h1>
      
      {/* User ID display */}
      <div className="mb-4 p-2 bg-gray-100 rounded">
        <p><strong>User ID:</strong> {userProfile?.uid || 'Not logged in'}</p>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex mb-4 border-b">
        <button 
          className={`px-4 py-2 ${state.activeTab === 'profile' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
          onClick={() => setState(prev => ({ ...prev, activeTab: 'profile' }))}
        >
          User Profile Data
        </button>
        <button 
          className={`px-4 py-2 ${state.activeTab === 'resume' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
          onClick={() => setState(prev => ({ ...prev, activeTab: 'resume' }))}
        >
          Resume Analysis Data
        </button>
        <button 
          className={`px-4 py-2 ${state.activeTab === 'api' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
          onClick={() => setState(prev => ({ ...prev, activeTab: 'api' }))}
        >
          Test API
        </button>
      </div>
      
      {/* Content Area */}
      <div className="mt-4">
        {/* Profile Data Tab */}
        {state.activeTab === 'profile' && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Raw User Profile Data</h2>
            {state.loading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : state.error ? (
              <div className="p-4 bg-red-50 text-red-700 rounded">
                <p>Error: {state.error}</p>
              </div>
            ) : (
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-[500px] text-sm">
                {formatJson(state.rawUserData)}
              </pre>
            )}
          </div>
        )}
        
        {/* Resume Analysis Tab */}
        {state.activeTab === 'resume' && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Resume Analysis Data</h2>
            {state.loading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : state.error ? (
              <div className="p-4 bg-red-50 text-red-700 rounded">
                <p>Error: {state.error}</p>
              </div>
            ) : !state.rawUserData?.resumeAnalysis ? (
              <div className="p-4 bg-yellow-50 text-yellow-700 rounded">
                <p>No resume analysis data found</p>
              </div>
            ) : (
              <div>
                <h3 className="font-medium mb-2">Resume Meta Info</h3>
                <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                  <div className="bg-gray-100 p-2 rounded">
                    <strong>Filename:</strong> {state.rawUserData?.resumeFilename || 'N/A'}
                  </div>
                  <div className="bg-gray-100 p-2 rounded">
                    <strong>Last Updated:</strong> {state.rawUserData?.updatedAt ? new Date(state.rawUserData.updatedAt.seconds * 1000).toLocaleString() : 'N/A'}
                  </div>
                  <div className="bg-gray-100 p-2 rounded">
                    <strong>URL:</strong> {state.rawUserData?.resumeUrl ? '✓ Available' : '✗ Missing'}
                  </div>
                </div>
                
                <h3 className="font-medium mb-2">Analysis Data</h3>
                <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-[500px] text-sm">
                  {formatJson(state.rawUserData?.resumeAnalysis)}
                </pre>
              </div>
            )}
          </div>
        )}
        
        {/* API Test Tab */}
        {state.activeTab === 'api' && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Test Resume Analysis API</h2>
            <div className="mb-4">
              <label className="block mb-2 font-medium">Resume Text:</label>
              <textarea
                className="w-full p-2 border border-gray-300 rounded min-h-[200px]"
                value={state.testResumeText}
                onChange={(e) => setState(prev => ({ ...prev, testResumeText: e.target.value }))}
                placeholder="Paste resume text here to test the analysis API directly..."
              ></textarea>
            </div>
            
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
              onClick={testAnalyzeApi}
              disabled={state.apiLoading || !state.testResumeText}
            >
              {state.apiLoading ? 'Analyzing...' : 'Test Analysis API'}
            </button>
            
            {state.apiError && (
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded">
                <p><strong>Error:</strong> {state.apiError}</p>
              </div>
            )}
            
            {state.apiResponse && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">API Response</h3>
                <div className="mb-2 text-sm">
                  <span className="bg-blue-100 rounded px-2 py-1 mr-2">
                    Processing Time: {(state.apiResponse as any)._debug?.totalProcessingTime || 'N/A'} ms
                  </span>
                  <span className="bg-green-100 rounded px-2 py-1">
                    Skills Found: {state.apiResponse.skills?.length || 0}
                  </span>
                </div>
                <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-[500px] text-sm">
                  {formatJson(state.apiResponse)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeAnalysisDebug; 