'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { analyzeResume } from '@/services/openai';

export default function VercelDebugPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Show current base URL
    setApiUrl(window.location.origin);
  }, []);

  const handleAuthorize = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple password protection (not secure, just to prevent accidental access)
    if (password === 'debug-pivotai-2024') {
      setIsAuthorized(true);
    } else {
      setStatusMessage('Invalid password');
    }
  };

  // Helper function to safely convert Headers to object
  const headersToObject = (headers: Headers): Record<string, string> => {
    const result: Record<string, string> = {};
    // Use forEach which is supported in all environments
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  };

  const testEndpoint = async (endpoint: string) => {
    setIsLoading(true);
    setStatusMessage('');
    setTestResult(null);
    
    try {
      const response = await fetch(`/api/${endpoint}`);
      const status = response.status;
      
      try {
        const data = await response.json();
        setTestResult({
          status,
          data,
          headers: headersToObject(response.headers)
        });
      } catch (err) {
        const text = await response.text();
        setTestResult({
          status,
          text,
          headers: headersToObject(response.headers)
        });
      }
    } catch (error) {
      setStatusMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
      setTestResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const testResumeAnalysis = async () => {
    setIsLoading(true);
    setStatusMessage('');
    setTestResult(null);
    
    try {
      // Test sample resume
      const sampleResume = "John Doe\nSoftware Engineer\n\nExperience:\n- Frontend Developer at ABC Corp (2020-2022)\n- Junior Developer at XYZ Inc (2018-2020)\n\nSkills: JavaScript, React, TypeScript, Node.js\n\nEducation: Computer Science, University of Example (2018)";
      
      const result = await analyzeResume(sampleResume);
      setTestResult(result);
      setStatusMessage('Resume analysis successful!');
    } catch (error) {
      setStatusMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkEnvironmentVariables = () => {
    setIsLoading(true);
    setTestResult(null);
    
    fetch('/api/debug/env')
      .then(res => res.json())
      .then(data => {
        setTestResult(data);
      })
      .catch(err => {
        setStatusMessage(`Error checking env vars: ${err.message}`);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Password protection UI
  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-center">Vercel Debugging</h1>
          
          {statusMessage && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {statusMessage}
            </div>
          )}
          
          <form onSubmit={handleAuthorize}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Debug Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="Enter debug password"
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              Access Debug Tools
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Main debug page UI
  return (
    <div className="container mx-auto p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <h1 className="text-2xl font-bold mb-2">Vercel Deployment Debugger</h1>
        <p className="text-gray-600 mb-4">API Base URL: {apiUrl}</p>
        
        {statusMessage && (
          <div className={`mb-4 p-3 rounded ${
            statusMessage.includes('Error') 
              ? 'bg-red-100 text-red-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            {statusMessage}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => testEndpoint('test')}
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            Test /api/test Endpoint
          </button>
          
          <button
            onClick={testResumeAnalysis}
            disabled={isLoading}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            Test Resume Analysis Flow
          </button>
          
          <button
            onClick={checkEnvironmentVariables}
            disabled={isLoading}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            Check Environment Variables
          </button>
          
          <button
            onClick={() => router.push('/')}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
          >
            Return to Homepage
          </button>
        </div>
      </div>
      
      {isLoading && (
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6 flex justify-center">
          <p>Loading...</p>
        </div>
      )}
      
      {testResult && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Test Result</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 