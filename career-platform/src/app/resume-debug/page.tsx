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
          <p className="text-xs text-gray-500 mt-1">
            Include details like skills, experience, education, etc. to get meaningful results.
          </p>
        </div>
        
        <button
          onClick={testAnalyzeResume}
          disabled={loading || !resumeText.trim()}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Analyze Resume'}
        </button>
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
            <h3 className="font-bold text-red-700">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {response && (
          <div className="mt-6">
            <h3 className="font-bold text-xl mb-2">Analysis Results</h3>
            <div className="mt-4">
              <h4 className="font-semibold">Status: 
                <span className={response.status === 200 ? "text-green-600" : "text-red-600"}>
                  {" " + response.status} {response.ok ? '✅' : '❌'}
                </span>
              </h4>
              
              {response.data && (
                <div className="mt-4 space-y-6">
                  <div>
                    <h4 className="font-semibold text-lg">Skills:</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {response.data.skills && response.data.skills.length > 0 ? (
                        response.data.skills.map((skill: string, index: number) => (
                          <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <p className="text-gray-500">No skills detected</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-lg">Experience:</h4>
                    <ul className="list-disc pl-5 mt-2">
                      {response.data.experience && response.data.experience.length > 0 ? (
                        response.data.experience.map((exp: string, index: number) => (
                          <li key={index} className="text-gray-700">{exp}</li>
                        ))
                      ) : (
                        <p className="text-gray-500">No experience detected</p>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-lg">Education:</h4>
                    <ul className="list-disc pl-5 mt-2">
                      {response.data.education && response.data.education.length > 0 ? (
                        response.data.education.map((edu: string, index: number) => (
                          <li key={index} className="text-gray-700">{edu}</li>
                        ))
                      ) : (
                        <p className="text-gray-500">No education detected</p>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-lg">Strengths:</h4>
                    <ul className="list-disc pl-5 mt-2">
                      {response.data.strengths && response.data.strengths.length > 0 ? (
                        response.data.strengths.map((strength: string, index: number) => (
                          <li key={index} className="text-gray-700">{strength}</li>
                        ))
                      ) : (
                        <p className="text-gray-500">No strengths detected</p>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-lg">Weaknesses:</h4>
                    <ul className="list-disc pl-5 mt-2">
                      {response.data.weaknesses && response.data.weaknesses.length > 0 ? (
                        response.data.weaknesses.map((weakness: string, index: number) => (
                          <li key={index} className="text-gray-700">{weakness}</li>
                        ))
                      ) : (
                        <p className="text-gray-500">No weaknesses detected</p>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-lg">Recommendations:</h4>
                    <ul className="list-disc pl-5 mt-2">
                      {response.data.recommendations && response.data.recommendations.length > 0 ? (
                        response.data.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="text-gray-700">{rec}</li>
                        ))
                      ) : (
                        <p className="text-gray-500">No recommendations detected</p>
                      )}
                    </ul>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-lg">Debug Info:</h4>
                    <pre className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded overflow-auto text-sm">
                      {JSON.stringify(response.data._debug || {}, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button 
                  onClick={() => {
                    const el = document.createElement('textarea');
                    el.value = JSON.stringify(response, null, 2);
                    document.body.appendChild(el);
                    el.select();
                    document.execCommand('copy');
                    document.body.removeChild(el);
                    alert('Response copied to clipboard!');
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded text-sm"
                >
                  Copy Full Response
                </button>
                
                <div className="mt-2">
                  <h4 className="font-semibold">Full Response:</h4>
                  <pre className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded overflow-auto text-xs max-h-96">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 