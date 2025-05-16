'use client';

import React, { useState } from 'react';
import { analyzeResume } from '@/services/openai';

export default function ResumeApiDebug() {
  const [resumeText, setResumeText] = useState<string>('This is a test resume. Skills: JavaScript, React, Node.js, TypeScript. Experience: 3 years as Frontend Developer at TechCorp, 2 years as Junior Developer at StartupX.');
  const [requestInProgress, setRequestInProgress] = useState<boolean>(false);
  const [apiCallTime, setApiCallTime] = useState<number | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiRawResponse, setApiRawResponse] = useState<string | null>(null);
  const [requestLogs, setRequestLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setRequestLogs(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };

  const handleApiCall = async () => {
    // Reset states
    setRequestInProgress(true);
    setApiResponse(null);
    setApiError(null);
    setApiRawResponse(null);
    setRequestLogs([]);
    setApiCallTime(null);

    addLog('Starting API call...');
    addLog(`Resume text length: ${resumeText.length} characters`);

    let originalFetch: typeof fetch = window.fetch;

    try {
      // Override fetch to capture the raw response
      originalFetch = window.fetch;
      window.fetch = async function(input, init) {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input instanceof Request ? input.url : '';
        
        if (url.includes('/api/analyze-resume')) {
          addLog(`API call to: ${url}`);
          addLog(`Request method: ${init?.method || 'GET'}`);
          
          if (init?.body) {
            try {
              const bodyData = JSON.parse(init.body.toString());
              addLog(`Request payload: ${init.body.toString().substring(0, 100)}...`);
              addLog(`Resume text in request (first 100 chars): ${bodyData.resumeText.substring(0, 100)}...`);
            } catch (e) {
              addLog(`Could not parse request body: ${e}`);
            }
          }
        }
        
        const response = await originalFetch(input, init);
        
        if (url.includes('/api/analyze-resume')) {
          addLog(`Response status: ${response.status} ${response.statusText}`);
          
          // Clone the response to read its content without consuming it
          const clone = response.clone();
          
          try {
            const text = await clone.text();
            setApiRawResponse(text);
            addLog(`Raw response received (${text.length} characters)`);
            addLog(`Response preview: ${text.substring(0, 100)}...`);
          } catch (e) {
            addLog(`Error reading response: ${e}`);
          }
        }
        
        return response;
      };

      // Start timer
      const startTime = performance.now();
      
      // Make the actual API call
      addLog('Calling analyzeResume function...');
      const result = await analyzeResume(resumeText);
      
      // End timer
      const endTime = performance.now();
      const timeElapsed = endTime - startTime;
      setApiCallTime(timeElapsed);
      addLog(`API call completed in ${timeElapsed.toFixed(2)}ms`);
      
      // Restore original fetch
      window.fetch = originalFetch;

      // Process result
      setApiResponse(result);
      addLog('API call successful');
      addLog(`Skills found: ${result.skills?.length || 0}`);
      addLog(`Experience items: ${result.experience?.length || 0}`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setApiError(errorMessage);
      addLog(`API call failed: ${errorMessage}`);
      
      // Try to get detailed error info
      if (error instanceof Error && 'stack' in error) {
        addLog(`Error stack: ${(error as any).stack}`);
      }
      
      // Restore original fetch
      window.fetch = originalFetch;
    } finally {
      setRequestInProgress(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Resume API Debugging Tool</h1>
      <p className="mb-4 text-gray-600">
        This tool tests the resume analysis API call and displays detailed information about the request and response.
      </p>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Resume Text
        </label>
        <textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          className="w-full h-60 p-3 border border-gray-300 rounded-md font-mono text-sm"
          placeholder="Enter resume text to analyze..."
        />
      </div>

      <button
        onClick={handleApiCall}
        disabled={requestInProgress || !resumeText.trim()}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50 mb-6"
      >
        {requestInProgress ? 'Processing...' : 'Test API Call'}
      </button>

      {/* Request Logs */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Request Logs</h2>
        <div className="bg-gray-800 text-green-400 p-4 rounded-md h-60 overflow-y-auto font-mono text-sm">
          {requestLogs.length > 0 ? (
            requestLogs.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))
          ) : (
            <div className="text-gray-500">No logs yet. Run the API test to see logs.</div>
          )}
        </div>
      </div>

      {/* API Call Stats */}
      {apiCallTime !== null && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">API Call Statistics</h2>
          <div className="bg-white p-4 rounded-md border border-gray-200">
            <p><span className="font-medium">Time taken:</span> {apiCallTime.toFixed(2)}ms</p>
            <p><span className="font-medium">Input size:</span> {resumeText.length} characters</p>
            {apiResponse && (
              <>
                <p><span className="font-medium">Skills found:</span> {apiResponse.skills?.length || 0}</p>
                <p><span className="font-medium">Experience items:</span> {apiResponse.experience?.length || 0}</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* API Error */}
      {apiError && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-red-600">API Error</h2>
          <div className="bg-red-50 border border-red-200 p-4 rounded-md">
            <p className="text-red-700">{apiError}</p>
          </div>
        </div>
      )}

      {/* Raw API Response */}
      {apiRawResponse && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Raw API Response</h2>
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-md h-60 overflow-y-auto">
            <pre className="text-xs font-mono whitespace-pre-wrap">{apiRawResponse}</pre>
          </div>
        </div>
      )}

      {/* Parsed Response */}
      {apiResponse && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Parsed API Response</h2>
          <div className="bg-white border border-gray-200 p-4 rounded-md">
            <div className="mb-4">
              <h3 className="font-bold text-lg mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {apiResponse.skills && apiResponse.skills.length > 0 ? (
                  apiResponse.skills.map((skill: string, index: number) => (
                    <span key={index} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">No skills detected</p>
                )}
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="font-bold text-lg mb-2">Skill Levels</h3>
              <div className="space-y-2">
                {apiResponse.skillLevels && apiResponse.skillLevels.length > 0 ? (
                  apiResponse.skillLevels.map((skillLevel: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded p-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{skillLevel.skill}</span>
                        <span className="bg-blue-100 text-blue-700 px-2 rounded">{skillLevel.level}/10</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{skillLevel.evidence}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No skill levels detected</p>
                )}
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="font-bold text-lg mb-2">Experience</h3>
              <ul className="list-disc pl-5">
                {apiResponse.experience && apiResponse.experience.length > 0 ? (
                  apiResponse.experience.map((exp: string, index: number) => (
                    <li key={index} className="mb-1">{exp}</li>
                  ))
                ) : (
                  <p className="text-gray-500">No experience detected</p>
                )}
              </ul>
            </div>
            
            <div className="mb-4">
              <h3 className="font-bold text-lg mb-2">Full Response</h3>
              <pre className="text-xs bg-gray-50 p-3 rounded-md overflow-x-auto">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 