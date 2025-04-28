import React, { useState, useEffect } from 'react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { analyzeResume } from '@/services/openai';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { ResumeAnalysis, CandidateProfile } from '@/types/user';

// Extend Window interface to include our debug logs
declare global {
  interface Window {
    _debugLogs?: any[];  // Changed from specific type to any[] to match other declarations
  }
}

// Debug helper
const debug = {
  log: (...args: any[]) => console.log('[DEBUG:ResumeUpload]', ...args),
  error: (...args: any[]) => console.error('[DEBUG:ResumeUpload:ERROR]', ...args),
  warn: (...args: any[]) => console.warn('[DEBUG:ResumeUpload:WARN]', ...args),
  group: (label: string) => console.group(`[DEBUG:ResumeUpload] ${label}`),
  groupEnd: () => console.groupEnd(),
  table: (data: any) => console.table(data)
};

export default function ResumeUpload() {
  const { userProfile } = useAuth();
  const { uploadFile, uploading, progress } = useFileUpload();
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});

  // Log component mounting for debugging
  useEffect(() => {
    debug.log('ResumeUpload component mounted');
    
    // Add global network request debugging
    const origFetch = window.fetch;
    window.fetch = async function(input, init) {
      // Only debug API calls
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input instanceof Request ? input.url : '';
      
      if (url.includes('/api/')) {
        debug.group(`Network Request: ${init?.method || 'GET'} ${url}`);
        debug.log('Request headers:', init?.headers);
        debug.log('Request body:', init?.body);
        
        try {
          const response = await origFetch(input, init);
          
          // Clone the response so we can read its content
          const clone = response.clone();
          debug.log('Response status:', response.status);
          
          // Convert headers to object safely
          const headerObj: Record<string, string> = {};
          clone.headers.forEach((value, key) => {
            headerObj[key] = value;
          });
          debug.log('Response headers:', headerObj);
          
          try {
            const text = await clone.text();
            debug.log('Response body:', text.substring(0, 1000) + (text.length > 1000 ? '...' : ''));
          } catch (e) {
            debug.error('Failed to read response body:', e);
          }
          
          debug.groupEnd();
          return response;
        } catch (error) {
          debug.error('Fetch error:', error);
          debug.groupEnd();
          throw error;
        }
      }
      
      return origFetch(input, init);
    };
    
    // Clean up the fetch override when component unmounts
    return () => {
      window.fetch = origFetch;
      debug.log('ResumeUpload component unmounted');
    };
  }, []);

  const extractTextFromFile = (file: File): Promise<string> => {
    debug.log(`Extracting text from file: ${file.name} (${file.type}, ${file.size} bytes)`);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          if (!event.target || !event.target.result) {
            const error = new Error('Failed to read file content');
            debug.error('File read error:', error);
            reject(error);
            return;
          }
          
          // For text files, we can use the result directly
          if (file.type === 'text/plain') {
            debug.log('Text file detected, using direct content');
            resolve(event.target.result as string);
            return;
          }
          
          // For PDFs and other complex files, we use a simplified extraction
          // In a real app, you would use a proper PDF parser library
          const content = event.target.result as string;
          
          // Remove non-printable characters and normalize whitespace
          const cleanedText = content
            .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '') // Remove control characters
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
          
          if (cleanedText.length < 100) {
            // If the text is too short, it's likely we couldn't extract meaningful content
            debug.warn('Extracted text is too short, might be binary content');
            resolve(`This appears to be a binary or image-based file. 
            File name: ${file.name}
            File type: ${file.type}
            File size: ${file.size} bytes
            This is a resume for parsing. Please extract any visible text from this document.`);
          } else {
            debug.log(`Successfully extracted text (${cleanedText.length} characters)`);
            resolve(cleanedText);
          }
        } catch (err) {
          debug.error('Error extracting text:', err);
          reject(err);
        }
      };
      
      reader.onerror = (event) => {
        const error = new Error(`Failed to read file: ${file.name}`);
        debug.error('FileReader error:', event, error);
        reject(error);
      };
      
      // Read as text for now, in a real app you'd use different methods based on file type
      reader.readAsText(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      debug.log(`File selected: ${selectedFile.name} (${selectedFile.type}, ${selectedFile.size} bytes)`);
      
      setFile(selectedFile);
      setError(null); // Clear any previous errors
      
      try {
        const extractedText = await extractTextFromFile(selectedFile);
        debug.log('Extracted text length:', extractedText.length);
        setDebugInfo((prev: Record<string, any>) => ({ ...prev, extractedTextLength: extractedText.length }));
        setResumeText(extractedText);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        debug.error('Error reading file:', err);
        setError(`Could not read the file content: ${errorMsg}. Please try a different file format.`);
        setDebugInfo((prev: Record<string, any>) => ({ ...prev, fileReadError: errorMsg }));
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !userProfile) {
      debug.warn('Upload attempted without file or user profile');
      return;
    }
    
    const requestStartTime = new Date();
    const debugData: any = {
      requestStartTime,
      fileInfo: {
        name: file.name,
        type: file.type,
        size: file.size
      },
      userId: userProfile.uid
    };
    
    try {
      debug.group('Resume Upload Process');
      debug.log('Starting resume upload and analysis');
      
      setError(null); // Clear any previous errors
      setSuccessMessage(null); // Clear any previous success messages
      
      // Check Firebase connectivity first
      debug.log('Checking Firebase connectivity...');
      try {
        // Simple Firestore ping to check connection
        if (!userProfile || !userProfile.uid) {
          throw new Error('User profile not available. Please try logging out and back in.');
        }
        
        // Upload file to Firebase Storage
        debug.log('Starting file upload to Firebase Storage...');
        debug.log('This will replace any existing resume file');
        
        const resumeUrl = await uploadFile(file, `resumes/${userProfile.uid}`);
        debug.log('File uploaded successfully:', resumeUrl);
        debugData.resumeUrl = resumeUrl;
        
        // Analyze resume with GPT-4
        setAnalyzing(true);
        debug.log('Analyzing resume text. Length:', resumeText.length);
        debugData.resumeTextLength = resumeText.length;
        
        if (!resumeText || resumeText.trim() === '') {
          const error = new Error('Unable to extract text from file. Please try a different file format.');
          debug.error(error.message);
          throw error;
        }
        
        // Use a sample of the text for debugging
        const textSample = resumeText.substring(0, 200) + '...';
        debug.log('Text sample:', textSample);
        debugData.textSample = textSample;
        
        try {
          debug.log('Calling analyzeResume API...');
          debugData.apiCallStartTime = new Date();
          
          // Add retry logic for API calls
          let attempts = 0;
          const maxAttempts = 2;
          let resumeAnalysis: ResumeAnalysis | null = null;
          
          while (attempts < maxAttempts && !resumeAnalysis) {
            try {
              attempts++;
              if (attempts > 1) {
                debug.log(`Retry attempt ${attempts}/${maxAttempts}...`);
              }
              
              resumeAnalysis = await analyzeResume(resumeText);
              
              if (!resumeAnalysis) {
                throw new Error('Resume analysis returned empty result');
              }
            } catch (apiRetryError) {
              if (attempts >= maxAttempts) {
                throw apiRetryError;
              }
              // Wait before retry (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
            }
          }
          
          if (!resumeAnalysis) {
            throw new Error('Failed to analyze resume after multiple attempts');
          }
          
          debugData.apiCallEndTime = new Date();
          debugData.apiCallDuration = debugData.apiCallEndTime - debugData.apiCallStartTime;
          debug.log(`API call completed in ${debugData.apiCallDuration}ms`);
          
          setAnalysis(resumeAnalysis);
          debugData.analysisReceived = !!resumeAnalysis;
          debug.log('Resume analysis complete:', resumeAnalysis);
          
          // Update user profile with resume URL and analysis
          debug.log('Updating user profile in Firestore...');
          try {
            await updateDoc(doc(db, 'users', userProfile.uid), {
              resumeUrl,
              resumeAnalysis,
            });
            
            debugData.firestoreUpdateTime = new Date();
            debug.log('User profile updated with resume data');
            setAnalyzing(false);
            setSuccessMessage('Resume uploaded and analyzed successfully! Previous resume (if any) has been replaced.');
            debugData.success = true;
          } catch (firestoreError: any) {
            debug.error('Error updating Firestore:', firestoreError);
            // Continue and show success even if Firestore update fails
            // The file upload and analysis were successful
            setAnalyzing(false);
            setSuccessMessage('Resume analyzed successfully, but there was an issue saving to your profile. Your analysis is displayed below.');
            debugData.success = true;
            debugData.firestoreError = firestoreError instanceof Error ? 
              { message: firestoreError.message, stack: firestoreError.stack } : 
              String(firestoreError);
          }
        } catch (apiError: any) {
          debug.error('API error during resume analysis:', apiError);
          debugData.apiError = apiError instanceof Error ? 
            { message: apiError.message, stack: apiError.stack } : 
            String(apiError);
          
          // Detailed network debugging for API errors
          debug.log('Checking if API error is a network issue...');
          
          // Test the API endpoint with a simple ping
          try {
            debug.log('Testing API endpoint with OPTIONS request...');
            const testResponse = await fetch('/api/analyze-resume', { method: 'OPTIONS' });
            debug.log('OPTIONS response status:', testResponse.status);
            debugData.optionsTestStatus = testResponse.status;
            
            if (testResponse.status === 405) {
              debug.error('API endpoint returned 405 for OPTIONS request - Method Not Allowed');
              debugData.endpointAccessible = false;
              setError('The API endpoint does not support the request method. Please contact support.');
            } else {
              debug.log('API endpoint is accessible');
              debugData.endpointAccessible = true;
              setError(`Resume analysis failed: ${apiError.message || 'Unknown error'}`);
            }
          } catch (testError) {
            debug.error('Failed to test API endpoint:', testError);
            debugData.apiTestError = testError instanceof Error ? 
              { message: testError.message, stack: testError.stack } : 
              String(testError);
            setError(`Resume analysis failed, and API endpoint test also failed. Please check your network connection.`);
          }
          
          setAnalyzing(false);
          throw apiError; // Re-throw for outer catch
        }
      } catch (error: any) {
        console.error('Error uploading resume:', error);
        debug.error('Overall error in upload process:', error);
        
        // If not already set by a specific handler
        if (!debugData.apiError && !debugData.apiTestError) {
          debugData.generalError = error instanceof Error ? 
            { message: error.message, stack: error.stack } : 
            String(error);
        }
        
        debugData.success = false;
        debugData.errorTime = new Date();
        
        if (!error) setError('An unknown error occurred. Please try again.');
        setAnalyzing(false);
      } finally {
        debugData.processDuration = new Date().getTime() - requestStartTime.getTime();
        debug.log(`Process completed in ${debugData.processDuration}ms`);
        debug.log('Debug data:', debugData);
        setDebugInfo(debugData);
        debug.groupEnd();
        
        // Add debug data to console for easy access
        if (!window._debugLogs) window._debugLogs = [];
        (window._debugLogs as any[]).push({
          timestamp: new Date().toISOString(),
          component: 'ResumeUpload',
          data: debugData
        });
        
        debug.log('Full debug logs available at window._debugLogs');
      }
    } catch (error: any) {
      console.error('Error uploading resume:', error);
      debug.error('Overall error in upload process:', error);
      
      // If not already set by a specific handler
      if (!debugData.apiError && !debugData.apiTestError) {
        debugData.generalError = error instanceof Error ? 
          { message: error.message, stack: error.stack } : 
          String(error);
      }
      
      debugData.success = false;
      debugData.errorTime = new Date();
      
      if (!error) setError('An unknown error occurred. Please try again.');
      setAnalyzing(false);
    }
  };

  // Check if userProfile has a resumeUrl (it's a CandidateProfile)
  const hasExistingResume = userProfile && 
    typeof userProfile === 'object' && 
    'resumeUrl' in userProfile && 
    Boolean(userProfile.resumeUrl);

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Upload Your Resume</h2>
      <p className="text-sm text-gray-600 mb-4">Uploading a new resume will replace any existing resume in your profile.</p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <button 
            onClick={() => console.log('Debug info:', debugInfo)} 
            className="text-xs underline mt-1"
          >
            Show debug info in console
          </button>
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
      )}
      
      {hasExistingResume && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded">
          <p className="font-medium">You have an existing resume uploaded.</p>
          <p className="text-sm">Uploading a new one will replace it.</p>
        </div>
      )}
      
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">
          Resume (PDF, DOC, DOCX, or TXT)
        </label>
        <input
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileChange}
          className="block w-full text-gray-700 border border-gray-300 rounded py-2 px-3"
        />
        <p className="mt-1 text-sm text-gray-500">
          For best results, use a text-based PDF or TXT file.
        </p>
      </div>
      
      {file && (
        <button
          onClick={handleUpload}
          disabled={uploading || analyzing}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {uploading ? `Uploading: ${Math.round(progress)}%` : analyzing ? 'Analyzing...' : 'Upload and Replace'}
        </button>
      )}
      
      {analysis && (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-2">Resume Analysis</h3>
          
          {/* Check for fallback/placeholder data */}
          {analysis._error && (
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
              <p className="font-medium">Note: Some analysis data may be using placeholder values.</p>
              <p className="text-sm">The AI had difficulty processing some aspects of your resume. We've provided basic analysis where possible.</p>
              <button 
                onClick={() => console.log('Analysis raw data:', analysis)} 
                className="text-xs underline mt-1"
              >
                View raw data in console
              </button>
            </div>
          )}
          
          <div className="mb-4">
            <h4 className="font-bold">Skills</h4>
            {analysis.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {analysis.skills.map((skill, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  No specific skills were detected in your resume.
                </p>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-3">
                  <h5 className="text-sm font-medium text-yellow-800">Resume Tip:</h5>
                  <p className="text-sm text-yellow-700 mt-1">
                    Include a dedicated "Skills" section in your resume with explicitly listed skills like "Python", "React", "SQL", etc. Our system only extracts skills explicitly mentioned in your resume.
                  </p>
                  <p className="text-sm text-yellow-700 mt-2">
                    Example format:
                    <br />
                    <span className="font-medium">Skills:</span> JavaScript, React, Node.js, SQL, Docker, Project Management, Technical Writing
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <h4 className="font-bold">Experience</h4>
            {analysis.experience && analysis.experience.length > 0 ? (
              <ul className="list-disc pl-5 mt-1">
                {analysis.experience.map((exp, index) => (
                  <li key={index}>{exp}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No experience detected</p>
            )}
          </div>
          
          <div className="mb-4">
            <h4 className="font-bold">Education</h4>
            {analysis.education && analysis.education.length > 0 ? (
              <ul className="list-disc pl-5 mt-1">
                {analysis.education.map((edu, index) => (
                  <li key={index}>{edu}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No education detected</p>
            )}
          </div>
          
          <div className="mb-4">
            <h4 className="font-bold">Strengths</h4>
            {analysis.strengths && analysis.strengths.length > 0 ? (
              <ul className="list-disc pl-5 mt-1">
                {analysis.strengths.map((strength, index) => (
                  <li key={index}>{strength}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No strengths detected</p>
            )}
          </div>
          
          <div className="mb-4">
            <h4 className="font-bold">Areas for Improvement</h4>
            {analysis.weaknesses && analysis.weaknesses.length > 0 ? (
              <ul className="list-disc pl-5 mt-1">
                {analysis.weaknesses.map((weakness, index) => (
                  <li key={index}>{weakness}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No areas for improvement detected</p>
            )}
          </div>
          
          <div className="mb-4">
            <h4 className="font-bold">Recommendations</h4>
            {analysis.recommendations && analysis.recommendations.length > 0 ? (
              <ul className="list-disc pl-5 mt-1">
                {analysis.recommendations.map((recommendation, index) => (
                  <li key={index}>{recommendation}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No recommendations available</p>
            )}
          </div>
          
          {/* Debug information for non-production environments */}
          {process.env.NODE_ENV !== 'production' && analysis._debug && (
            <div className="mt-4 p-3 bg-gray-100 border border-gray-300 rounded text-xs">
              <p className="font-bold">Debug Info</p>
              <pre>{JSON.stringify(analysis._debug, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
      
      {/* Add debugging controls in development environment */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="mt-8 border-t pt-4">
          <h3 className="text-sm font-bold mb-2 text-gray-500">Debug Tools</h3>
          
          <div className="space-x-2">
            <button
              onClick={() => debug.log('Current debug info:', debugInfo)}
              className="text-xs bg-gray-200 px-2 py-1 rounded"
            >
              Log Debug Info
            </button>
            
            <button
              onClick={async () => {
                try {
                  const resp = await fetch('/api/analyze-resume', { method: 'OPTIONS' });
                  debug.log('OPTIONS test response:', resp.status, resp.statusText);
                } catch (e) {
                  debug.error('OPTIONS test error:', e);
                }
              }}
              className="text-xs bg-gray-200 px-2 py-1 rounded"
            >
              Test OPTIONS
            </button>
            
            <button
              onClick={async () => {
                try {
                  const resp = await fetch('/api/analyze-resume');
                  debug.log('GET test response:', resp.status, resp.statusText);
                  const text = await resp.text();
                  debug.log('Response body:', text);
                } catch (e) {
                  debug.error('GET test error:', e);
                }
              }}
              className="text-xs bg-gray-200 px-2 py-1 rounded"
            >
              Test GET
            </button>
          </div>
        </div>
      )}
    </div>
  );
}