'use client';

import React, { useState } from 'react';
import { analyzeResume } from '@/services/openai';

export default function DebugPage() {
  const [apiResult, setApiResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [testText, setTestText] = useState<string>('This is a sample resume for testing the API.');
  
  // Test plain GET request to test endpoint
  const testApiGet = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Testing GET /api/test...');
      const response = await fetch('/api/test');
      const data = await response.json();
      
      setApiResult(JSON.stringify(data, null, 2));
      console.log('GET test result:', data);
    } catch (err) {
      console.error('GET test error:', err);
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Test POST request to test endpoint
  const testApiPost = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Testing POST /api/test...');
      const response = await fetch('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          test: true, 
          timestamp: new Date().toISOString() 
        }),
      });
      
      const data = await response.json();
      setApiResult(JSON.stringify(data, null, 2));
      console.log('POST test result:', data);
    } catch (err) {
      console.error('POST test error:', err);
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Test resume analysis API
  const testResumeApi = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Testing resume analysis with text:', testText);
      const result = await analyzeResume(testText);
      
      setApiResult(JSON.stringify(result, null, 2));
      console.log('Resume analysis result:', result);
    } catch (err) {
      console.error('Resume analysis error:', err);
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">API Debugging Page</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-bold mb-2">Test API Routes</h2>
          
          <div className="flex flex-col gap-2">
            <button 
              onClick={testApiGet}
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Test GET /api/test
            </button>
            
            <button 
              onClick={testApiPost}
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Test POST /api/test
            </button>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-bold mb-2">Test Resume Analysis</h2>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              Test Resume Text
            </label>
            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="w-full h-32 border border-gray-300 rounded p-2"
            />
          </div>
          
          <button 
            onClick={testResumeApi}
            disabled={isLoading}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Test Resume Analysis
          </button>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-bold mb-2">API Result</h2>
        
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <p>Loading...</p>
          </div>
        ) : apiResult ? (
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {apiResult}
          </pre>
        ) : (
          <p className="text-gray-500">No results yet. Run a test to see output.</p>
        )}
      </div>
    </div>
  );
} 