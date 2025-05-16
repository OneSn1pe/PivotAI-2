import React, { useState } from 'react';
import { analyzeResume } from '@/services/openai';
import { ResumeAnalysis } from '@/types/user';

export default function ResumeAnalysisDebug() {
  const [resumeText, setResumeText] = useState<string>(
    'John Doe\nSoftware Engineer\n\nEXPERIENCE\nSenior Developer at Tech Corp (2018-Present)\n- Developed web applications using React and Node.js\n- Led a team of 5 developers\n\nJunior Developer at StartUp Inc (2015-2018)\n- Built frontend interfaces with HTML, CSS, and JavaScript\n\nEDUCATION\nBS in Computer Science, State University (2015)\n\nSKILLS\nJavaScript, TypeScript, React, Node.js, CSS, HTML, Git, AWS'
  );
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiRequestTime, setApiRequestTime] = useState<number | null>(null);

  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      setError('Please enter resume text to analyze');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);
    setApiResponse(null);
    
    const startTime = performance.now();
    
    try {
      console.log('Calling analyzeResume with text length:', resumeText.length);
      
      // Create our own fetch to intercept the response for debugging
      const baseUrl = window.location.origin;
      const apiUrl = `${baseUrl}/api/analyze-resume`;
      
      // Make API request directly to see raw response
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resumeText })
      });
      
      const responseTime = performance.now() - startTime;
      setApiRequestTime(Math.round(responseTime));
      
      console.log(`API response received in ${Math.round(responseTime)}ms, status:`, response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }
      
      // Get the raw API response for debugging
      const rawResponse = await response.text();
      console.log('Raw API response:', rawResponse);
      
      try {
        const parsedResponse = JSON.parse(rawResponse);
        setApiResponse(parsedResponse);
        
        // Also try the official analyze function as a comparison
        const analysisResult = await analyzeResume(resumeText);
        setAnalysis(analysisResult);
      } catch (parseError) {
        console.error('Error parsing API response:', parseError);
        throw new Error(`Failed to parse API response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Resume Analysis Debugger</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Resume Text (for testing)
        </label>
        <textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          className="w-full h-64 p-2 border border-gray-300 rounded font-mono text-sm"
          placeholder="Paste resume text here..."
        />
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Analyze Resume'}
        </button>
        
        {apiRequestTime && (
          <span className="text-sm text-gray-600">
            API response time: {apiRequestTime}ms
          </span>
        )}
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
          <h3 className="font-bold mb-2">Error</h3>
          <pre className="whitespace-pre-wrap text-sm">{error}</pre>
        </div>
      )}
      
      {apiResponse && (
        <div className="mb-6">
          <h3 className="font-bold text-lg mb-2">Raw API Response</h3>
          <div className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
            <pre className="text-xs">{JSON.stringify(apiResponse, null, 2)}</pre>
          </div>
        </div>
      )}
      
      {analysis && (
        <div className="mt-6">
          <h3 className="font-semibold text-lg mb-3">Processed Analysis Results</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.skills.map((skill, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Experience</h4>
              <ul className="list-disc pl-5 space-y-1">
                {analysis.experience.map((exp, index) => (
                  <li key={index} className="text-gray-700">{exp}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Education</h4>
              <ul className="list-disc pl-5 space-y-1">
                {analysis.education.map((edu, index) => (
                  <li key={index} className="text-gray-700">{edu}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Strengths</h4>
              <ul className="list-disc pl-5 space-y-1">
                {analysis.strengths.map((strength, index) => (
                  <li key={index} className="text-gray-700">{strength}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Areas for Improvement</h4>
              <ul className="list-disc pl-5 space-y-1">
                {analysis.weaknesses.map((weakness, index) => (
                  <li key={index} className="text-gray-700">{weakness}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Recommendations</h4>
              <ul className="list-disc pl-5 space-y-1">
                {analysis.recommendations.map((recommendation, index) => (
                  <li key={index} className="text-gray-700">{recommendation}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 