'use client';

import React, { useState } from 'react';
import { testApiEndpoint } from '@/services/openai';

export default function ApiDebugger() {
  const [endpoint, setEndpoint] = useState('/api/debug-test');
  const [method, setMethod] = useState<'GET' | 'POST' | 'OPTIONS'>('GET');
  const [requestBody, setRequestBody] = useState('{"test": "data"}');
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Test APIs directly
  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    
    try {
      console.log(`Testing ${method} ${endpoint}...`);
      
      let body = undefined;
      if (method === 'POST') {
        try {
          body = JSON.parse(requestBody);
        } catch (err) {
          setError(`Invalid JSON body: ${err instanceof Error ? err.message : String(err)}`);
          setLoading(false);
          return;
        }
      }
      
      const result = await testApiEndpoint(endpoint, method, body);
      console.log('Test result:', result);
      setResponse(result);
    } catch (err) {
      console.error('API test error:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };
  
  // Test analyze-resume endpoint specifically
  const testAnalyzeResumeAPI = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    
    try {
      // Test OPTIONS first
      console.log('Testing OPTIONS for /api/analyze-resume...');
      const optionsResult = await testApiEndpoint('/api/analyze-resume', 'OPTIONS');
      console.log('OPTIONS result:', optionsResult);
      
      // Then test POST with minimal payload
      console.log('Testing POST for /api/analyze-resume...');
      const postResult = await testApiEndpoint('/api/analyze-resume', 'POST', {
        resumeText: 'This is a test resume for debugging. Skills: debugging, troubleshooting. Experience: 5 years.'
      });
      console.log('POST result:', postResult);
      
      setResponse({
        options: optionsResult,
        post: postResult
      });
    } catch (err) {
      console.error('Analyze resume test error:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">API Debugger</h2>
      
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-800">
          This tool helps diagnose API issues by testing endpoints with different methods.
          It will help determine if the 405 error is related to CORS, middleware, or specific API implementation.
        </p>
        
        <button
          onClick={testAnalyzeResumeAPI}
          disabled={loading}
          className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Run Analyze Resume Diagnostic'}
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-2">API Endpoint</label>
          <input
            type="text"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            className="w-full border border-gray-300 rounded p-2"
            placeholder="/api/endpoint"
          />
        </div>
        
        <div>
          <label className="block text-gray-700 mb-2">HTTP Method</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as any)}
            className="w-full border border-gray-300 rounded p-2"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="OPTIONS">OPTIONS</option>
          </select>
        </div>
        
        {method === 'POST' && (
          <div>
            <label className="block text-gray-700 mb-2">Request Body (JSON)</label>
            <textarea
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 font-mono text-sm"
              rows={5}
            />
          </div>
        )}
        
        <button
          onClick={handleTest}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Endpoint'}
        </button>
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="font-bold text-red-700">Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {response && (
        <div className="mt-4">
          <h3 className="font-bold">Response</h3>
          <pre className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded overflow-auto text-sm">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 