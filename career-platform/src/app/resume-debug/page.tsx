'use client';

import React, { useState } from 'react';
import { testApiEndpoint } from '@/services/openai';

export default function ResumeDebugPage() {
  const [resumeText, setResumeText] = useState('This is a test resume. Skills: JavaScript, React, Node.js. Experience: 5 years of web development.');
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const testAnalyzeResume = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    
    try {
      // Test POST with the provided resume text
      console.log('Testing analyze-resume endpoint...');
      const result = await testApiEndpoint('/api/analyze-resume', 'POST', {
        resumeText
      });
      
      console.log('Test result:', result);
      setResponse(result);
    } catch (err) {
      console.error('Test error:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Resume Analysis Debugger</h1>
      <p className="mb-6 text-gray-600">
        Use this page to test the resume analysis API and diagnose any issues.
      </p>
      
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">Test Resume Analysis</h2>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Resume Text</label>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            className="w-full border border-gray-300 rounded p-3 h-40 font-mono text-sm"
            placeholder="Enter resume text to analyze..."
          />
        </div>
        
        <button
          onClick={testAnalyzeResume}
          disabled={loading || !resumeText.trim()}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Resume Analysis'}
        </button>
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
            <h3 className="font-bold text-red-700">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {response && (
          <div className="mt-4">
            <h3 className="font-bold">Response</h3>
            <div className="mt-2">
              <h4 className="font-semibold">Status: {response.status} {response.ok ? '✅' : '❌'}</h4>
              
              {response.data && (
                <div className="mt-2">
                  <h4 className="font-semibold">Skills:</h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {response.data.skills && response.data.skills.length > 0 ? (
                      response.data.skills.map((skill: string, index: number) => (
                        <span key={index} className="bg-gray-200 px-3 py-1 rounded-full text-sm">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500">No skills detected</p>
                    )}
                  </div>
                  
                  <h4 className="font-semibold mt-3">Strengths:</h4>
                  <ul className="list-disc pl-5 mt-1">
                    {response.data.strengths && response.data.strengths.length > 0 ? (
                      response.data.strengths.map((strength: string, index: number) => (
                        <li key={index}>{strength}</li>
                      ))
                    ) : (
                      <p className="text-gray-500">No strengths detected</p>
                    )}
                  </ul>
                  
                  <h4 className="font-semibold mt-3">Raw Response:</h4>
                  <pre className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded overflow-auto text-sm">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 