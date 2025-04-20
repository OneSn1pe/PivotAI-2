'use client';

import React, { useState, useEffect } from 'react';
import { analyzeResume } from '@/services/openai';

// Extend Window interface to include our debug logs
declare global {
  interface Window {
    _debugLogs?: Array<any>;
  }
}

export default function DebugPage() {
  const [apiResult, setApiResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiEndpoint, setApiEndpoint] = useState<string>('/api/debug-test');
  const [method, setMethod] = useState<string>('GET');
  const [testText, setTestText] = useState<string>('This is a sample resume for testing the API.');
  const [networkLogs, setNetworkLogs] = useState<any[]>([]);
  
  // Setup network monitoring
  useEffect(() => {
    console.log('Debug page loaded - setting up network monitoring');
    
    // Store original fetch
    const origFetch = window.fetch;
    
    // Create array for logs if it doesn't exist
    if (!window._debugLogs) {
      window._debugLogs = [];
    }
    
    // Override fetch to log API calls
    window.fetch = async function(input, init) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input instanceof Request ? input.url : '';
      
      // Only monitor API calls
      if (url.includes('/api/')) {
        const requestInfo = {
          url,
          method: init?.method || 'GET',
          headers: init?.headers,
          body: init?.body,
          timestamp: new Date().toISOString()
        };
        
        console.log(`[DEBUG-MONITOR] Request: ${requestInfo.method} ${url}`);
        
        try {
          const startTime = performance.now();
          const response = await origFetch(input, init);
          const duration = performance.now() - startTime;
          
          // Clone the response to read its content
          const clone = response.clone();
          
          // Convert headers to object
          const headers: Record<string, string> = {};
          clone.headers.forEach((value, key) => {
            headers[key] = value;
          });
          
          let responseBody = '';
          try {
            responseBody = await clone.text();
          } catch (e) {
            responseBody = 'Could not read response body';
          }
          
          const logEntry = {
            type: 'network',
            request: requestInfo,
            response: {
              status: response.status,
              statusText: response.statusText,
              headers,
              body: responseBody.substring(0, 500) + (responseBody.length > 500 ? '...' : ''),
              duration: Math.round(duration)
            },
            timestamp: new Date().toISOString()
          };
          
          // Add to global logs
          if (window._debugLogs) {
            window._debugLogs.push(logEntry);
          }
          
          // Update state with the new log
          setNetworkLogs(prev => [logEntry, ...prev.slice(0, 19)]);
          
          console.log(`[DEBUG-MONITOR] Response: ${response.status} (${Math.round(duration)}ms)`);
          
          return response;
        } catch (error) {
          const logEntry = {
            type: 'network-error',
            request: requestInfo,
            error: String(error),
            timestamp: new Date().toISOString()
          };
          
          // Add to global logs
          if (window._debugLogs) {
            window._debugLogs.push(logEntry);
          }
          
          // Update state with the new log
          setNetworkLogs(prev => [logEntry, ...prev.slice(0, 19)]);
          
          console.error(`[DEBUG-MONITOR] Error: ${error}`);
          throw error;
        }
      }
      
      return origFetch(input, init);
    };
    
    // Clean up
    return () => {
      window.fetch = origFetch;
    };
  }, []);
  
  // Test generic API call to endpoint
  const testApi = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Testing ${method} ${apiEndpoint}...`);
      
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        }
      };
      
      // Add body for POST requests
      if (method === 'POST') {
        options.body = JSON.stringify({ 
          resumeText: testText,
          test: true, 
          timestamp: new Date().toISOString() 
        });
      }
      
      const response = await fetch(apiEndpoint, options);
      let result;
      
      try {
        result = await response.json();
      } catch (e) {
        const text = await response.text();
        result = { text, parseError: "Could not parse as JSON" };
      }
      
      setApiResult(JSON.stringify(result, null, 2));
      console.log(`${method} test result:`, result);
    } catch (err) {
      console.error(`${method} test error:`, err);
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Test resume analysis API
  const testResumeAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Testing resume analysis with text:', testText.substring(0, 50) + '...');
      
      const startTime = performance.now();
      const result = await analyzeResume(testText);
      const duration = performance.now() - startTime;
      
      setApiResult(JSON.stringify(result, null, 2));
      console.log(`Resume analysis completed in ${Math.round(duration)}ms:`, result);
    } catch (err) {
      console.error('Resume analysis error:', err);
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">API Debug Tools</h1>
      <p className="text-sm text-gray-500 mb-6">
        Use these tools to test API endpoints and diagnose issues with resume analysis
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-3">Test API Endpoint</h2>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Endpoint
            </label>
            <input
              type="text"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="/api/path"
            />
          </div>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              HTTP Method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="OPTIONS">OPTIONS</option>
            </select>
          </div>
          
          {method === 'POST' && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Resume Text
              </label>
              <textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                className="w-full p-2 border rounded h-32"
                placeholder="Enter text to send as resumeText..."
              />
            </div>
          )}
          
          <div className="flex gap-2">
            <button
              onClick={testApi}
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : `Test ${method}`}
            </button>
            
            <button
              onClick={() => setApiEndpoint('/api/debug-test')}
              className="text-blue-500 hover:text-blue-700 text-sm underline"
            >
              Reset Endpoint
            </button>
          </div>
          
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setApiEndpoint('/api/analyze-resume')}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded text-sm"
            >
              Test Analyze Resume
            </button>
            
            <button
              onClick={testResumeAnalysis}
              disabled={isLoading}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
            >
              Run Full Analysis
            </button>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-3">API Response</h2>
          
          {error && (
            <div className="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <pre className="bg-gray-100 p-3 rounded h-80 overflow-auto text-xs">
            {apiResult || 'No response yet'}
          </pre>
        </div>
      </div>
      
      <div className="mt-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-3">Network Logs</h2>
        
        <div className="overflow-auto max-h-96">
          {networkLogs.length === 0 ? (
            <p className="text-gray-500 text-sm">No API calls logged yet</p>
          ) : (
            <div className="text-xs">
              {networkLogs.map((log, index) => (
                <div key={index} className={`mb-4 p-3 rounded ${log.type === 'network-error' ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <div className="font-bold">
                    {log.request.method} {log.request.url}
                    <span className="text-gray-500 ml-2">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  
                  {log.type === 'network' && (
                    <>
                      <div className={`mt-1 ${log.response.status >= 400 ? 'text-red-600' : 'text-green-600'}`}>
                        Status: {log.response.status} {log.response.statusText} ({log.response.duration}ms)
                      </div>
                      
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div>
                          <div className="font-semibold">Request Headers:</div>
                          <pre className="bg-gray-100 p-1 text-xs overflow-auto max-h-20">
                            {JSON.stringify(log.request.headers, null, 2)}
                          </pre>
                        </div>
                        
                        <div>
                          <div className="font-semibold">Response Headers:</div>
                          <pre className="bg-gray-100 p-1 text-xs overflow-auto max-h-20">
                            {JSON.stringify(log.response.headers, null, 2)}
                          </pre>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <div className="font-semibold">Response Body:</div>
                        <pre className="bg-gray-100 p-1 text-xs overflow-auto max-h-32">
                          {log.response.body}
                        </pre>
                      </div>
                    </>
                  )}
                  
                  {log.type === 'network-error' && (
                    <div className="mt-1 text-red-600">
                      Error: {log.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-3 flex justify-between">
          <button
            onClick={() => setNetworkLogs([])}
            className="text-red-500 hover:text-red-700 text-xs"
          >
            Clear Logs
          </button>
          
          <span className="text-xs text-gray-500">
            {networkLogs.length} log entries 
            ({window._debugLogs?.length ?? 0} total in console)
          </span>
        </div>
      </div>
    </div>
  );
} 