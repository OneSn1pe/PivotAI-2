'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { analyzeResume } from '@/services/openai';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { ResumeAnalysis, CandidateProfile } from '@/types/user';
import { ref, getDownloadURL, listAll, uploadBytes } from 'firebase/storage';
// Dynamically import heavy libraries only when needed
let pdfjsLib: any = null;
let mammoth: any = null;

interface ResumeManagerProps {
  onUpdateComplete?: (fileName: string) => void;
}

export default function ResumeManager({ onUpdateComplete }: ResumeManagerProps) {
  const { userProfile, updateUserProfile } = useAuth();
  const candidateProfile = userProfile as CandidateProfile | null;
  const { uploadFile, uploading, progress } = useFileUpload();
  
  const [file, setFile] = useState<File | null>(null);
  const [plainTextContent, setPlainTextContent] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validatedResumeUrl, setValidatedResumeUrl] = useState<string | null>(null);
  const [validatingUrl, setValidatingUrl] = useState(false);
  const [displayFileName, setDisplayFileName] = useState<string | null>(candidateProfile?.resumeFileName || null);
  const [isPdfJsLoaded, setIsPdfJsLoaded] = useState(false);
  
  // Load PDF.js library on client side only
  useEffect(() => {
    const loadPdfJs = async () => {
      try {
        // Only load PDF.js in browser environment
        if (typeof window === 'undefined') {
          return;
        }
        
        // Dynamically load pdf.js
        const pdfjs = await import('pdfjs-dist');
        
        // Get worker URL from the public folder where we copied the file
        // This ensures the worker is properly served with your app
        const workerUrl = '/pdf.worker.min.js'; // Served from the public directory
        
        // Set the worker source
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
        
        pdfjsLib = pdfjs;
        setIsPdfJsLoaded(true);
        console.log('PDF.js loaded successfully. Worker at:', workerUrl);
      } catch (err) {
        console.error('Failed to load PDF.js:', err);
        setError('Failed to load PDF processing library. PDF uploads may not work correctly.');
      }
    };
    
    loadPdfJs();
  }, []);
  
  // Validate resume URL on component mount
  useEffect(() => {
    forceGetLatestResume();
  }, []);
  
  // Update local filename state when profile changes
  useEffect(() => {
    if (candidateProfile?.resumeFileName) {
      setDisplayFileName(candidateProfile.resumeFileName);
    }
  }, [candidateProfile?.resumeFileName]);
  
  // Force get the latest resume from Storage rather than relying on the database URL
  const forceGetLatestResume = async () => {
    if (!userProfile?.uid) return;
    
    setValidatingUrl(true);
    setError(null);
    
    try {
      // Go directly to storage to find the most recent file
      const userResumesRef = ref(storage, `resumes/${userProfile.uid}`);
      
      // List all files in the user's resume directory
      const filesList = await listAll(userResumesRef);
      
      if (filesList.items.length === 0) {
        // No files found, but don't throw error as this might be first upload
        setValidatedResumeUrl(null);
        setValidatingUrl(false);
        return;
      }
      
      // Sort by name to get the most recent one (since we use timestamps in filenames)
      const sortedItems = [...filesList.items].sort((a, b) => {
        return b.name.localeCompare(a.name);
      });
      
      // Get the download URL of the most recent file
      const latestFileUrl = await getDownloadURL(sortedItems[0]);
      
      // Update the database with the correct URL if it doesn't match
      if (candidateProfile?.resumeUrl !== latestFileUrl) {
        console.log('URL in database does not match the latest file, updating...');
        await updateDoc(doc(db, 'users', userProfile.uid), {
          resumeUrl: latestFileUrl,
        });
      }
      
      setValidatedResumeUrl(latestFileUrl);
    } catch (err) {
      console.error('Error getting latest resume:', err);
      setError('Cannot access resume files. Please try again later.');
      setValidatedResumeUrl(null);
    } finally {
      setValidatingUrl(false);
    }
  };
  
  // Function to extract text from various file types
  const convertToPlainText = useCallback(async (file: File): Promise<string> => {
    console.log(`Converting ${file.name} (${file.type}) to plaintext`);
    
    try {
      // For plain text files, read directly
      if (file.type === 'text/plain') {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target && typeof e.target.result === 'string') {
              console.log(`Read ${e.target.result.length} characters from text file`);
              resolve(e.target.result);
            } else {
              reject(new Error('Failed to read text file'));
            }
          };
          reader.onerror = () => reject(new Error('Error reading text file'));
          reader.readAsText(file);
        });
      }
      
      // For PDF files, use PDF.js to extract text
      if (file.type === 'application/pdf') {
        if (!pdfjsLib || !isPdfJsLoaded) {
          throw new Error('PDF.js library not loaded. Please try again or use a different file format.');
        }
        
        console.log('Converting PDF to plaintext');
        const arrayBuffer = await file.arrayBuffer();
        
        // Load PDF document
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        console.log(`PDF loaded. Pages: ${pdf.numPages}`);
        
        let plaintext = '';
        
        // Extract text from each page
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => 'str' in item ? item.str : '')
            .join(' ');
          
          plaintext += pageText + '\n\n';
        }
        
        console.log(`Extracted ${plaintext.length} characters from PDF`);
        
        if (plaintext.trim().length < 100) {
          console.warn('PDF text is suspiciously short - may be image-based');
          plaintext += `\n\nNote: This PDF may contain images or scanned text that couldn't be fully extracted. 
          File: ${file.name}
          Size: ${Math.round(file.size / 1024)} KB`;
        }
        
        return plaintext;
      }
      
      // For DOCX files, dynamically load and use mammoth to extract text
      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        console.log('Converting DOCX to plaintext');
        
        // Dynamically import mammoth only when needed
        if (!mammoth) {
          mammoth = await import('mammoth');
        }
        
        const arrayBuffer = await file.arrayBuffer();
        
        const result = await mammoth.extractRawText({ arrayBuffer });
        const plaintext = result.value;
        
        console.log(`Extracted ${plaintext.length} characters from DOCX`);
        return plaintext;
      }
      
      // For other file types, return a simple error message
      return `Unsupported file type: ${file.type}. Please upload a PDF, DOCX, or TXT file.`;
      
    } catch (error) {
      console.error('Error converting file to plaintext:', error);
      throw new Error(`Failed to convert file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [isPdfJsLoaded]);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setError(null);
      
      try {
        console.log(`File selected: ${selectedFile.name} (${selectedFile.type})`);
        setSuccessMessage('Converting file to plaintext...');
        
        // Convert file to plaintext
        const plaintext = await convertToPlainText(selectedFile);
        console.log('Conversion completed. Length:', plaintext.length);
        
        setPlainTextContent(plaintext);
        setSuccessMessage('File converted to plaintext successfully');
      } catch (err) {
        console.error('Error converting file:', err);
        setError('Error processing file: ' + (err instanceof Error ? err.message : String(err)));
      }
    }
  };
  
  const handleUpload = async () => {
    if (!file || !userProfile) {
      setError('Please select a file to upload');
      return;
    }
    
    if (!plainTextContent.trim()) {
      setError('Could not extract text from the file. Please try a different file format.');
      return;
    }
    
    try {
      console.log('Starting resume upload and analysis process...');
      setError(null);
      setSuccessMessage(null);
      
      // Store the original file name in user-friendly format
      const originalFileName = file.name;
      
      // Create a unique path for the file that includes file extension
      const uniqueId = `${userProfile.uid}_${Date.now()}`;
      
      // Create a text file containing the plaintext content
      const plainTextBlob = new Blob([plainTextContent], { type: 'text/plain' });
      const plainTextFile = new File([plainTextBlob], `${uniqueId}_plaintext.txt`, { type: 'text/plain' });
      
      // Upload the plaintext file
      const filePath = `resumes/${userProfile.uid}/${uniqueId}_resume.txt`;
      console.log(`Uploading plaintext version of ${originalFileName} to path: ${filePath}`);
      
      const resumeUrl = await uploadFile(plainTextFile, filePath);
      console.log('Plaintext file uploaded successfully, URL:', resumeUrl);
      
      // Analyze resume
      setAnalyzing(true);
      console.log(`Starting resume analysis. Text length: ${plainTextContent.length}`);
      
      try {
        console.log('Calling analyzeResume API...');
        const analysisStartTime = performance.now();
        
        const resumeAnalysis = await analyzeResume(plainTextContent);
        
        const analysisTime = performance.now() - analysisStartTime;
        console.log(`Resume analysis completed in ${Math.round(analysisTime)}ms`);
        
        if (!resumeAnalysis) {
          console.error('Resume analysis returned null or undefined');
          throw new Error('Resume analysis failed. Please try again.');
        }
        
        console.log('Analysis results:', resumeAnalysis);
        
        setAnalysis(resumeAnalysis);
        
        // Update user profile with the new URL and analysis
        console.log('Updating user profile in Firestore...');
        await updateDoc(doc(db, 'users', userProfile.uid), {
          resumeUrl,
          resumeFileName: originalFileName, // Store original filename for display
          resumeAnalysis,
          updatedAt: serverTimestamp(),
        });
        
        console.log('Firestore update completed, updating UI state...');
        
        // Set the validated URL to the new URL
        setValidatedResumeUrl(resumeUrl);
        
        // Update local state with new filename immediately
        setDisplayFileName(originalFileName);
        
        setAnalyzing(false);
        setSuccessMessage('Resume updated and analyzed successfully!');
        
        // Notify parent component of update
        if (onUpdateComplete) {
          console.log('Notifying parent of update completion');
          onUpdateComplete(originalFileName);
        }
        
        // Refresh the user's profile in AuthContext
        await updateUserProfile();
        
      } catch (analysisError) {
        console.error('Error during resume analysis:', analysisError);
        throw analysisError; // Re-throw to be caught by outer catch block
      }
      
    } catch (err) {
      console.error('Overall error in handleUpload:', err);
      setAnalyzing(false);
      
      // Provide more user-friendly error message
      let errorMessage = 'Error: ' + (err instanceof Error ? err.message : String(err));
      
      // Check for specific API errors
      if (err instanceof Error && 'status' in err) {
        const apiError = err as Error & { status: number; details?: string };
        if (apiError.status === 405) {
          errorMessage = 'The resume analysis service is not accepting requests correctly. Please try again later.';
        } else if (apiError.details) {
          errorMessage = `${err.message}. ${apiError.details}`;
        }
      }
      
      setError(errorMessage);
    }
  };
  
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900">Resume Management</h2>
        <p className="text-sm text-gray-600 mt-1">Upload and analyze your professional experience</p>
      </div>
      
      {candidateProfile?.resumeUrl && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">Current Resume</h3>
              <p className="text-sm text-gray-600">
                {displayFileName ? (
                  <>{displayFileName} • </>
                ) : null}
                Updated {candidateProfile.updatedAt ? 
              (candidateProfile.updatedAt instanceof Date ? 
                candidateProfile.updatedAt.toLocaleDateString() : 
                // Handle Firebase Timestamp or string conversion
                (typeof candidateProfile.updatedAt === 'object' && candidateProfile.updatedAt !== null && 'toDate' in candidateProfile.updatedAt) ? 
                  (candidateProfile.updatedAt as { toDate(): Date }).toDate().toLocaleDateString() :
                  new Date(candidateProfile.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })
              ) : 'Unknown'
            }
              </p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Upload New Resume</h3>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
          <input
            type="file"
            onChange={handleFileChange}
            className="hidden"
            id="resume-file"
            accept=".pdf,.docx,.txt"
          />
          <label
            htmlFor="resume-file"
            className="cursor-pointer block"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-3 text-sm text-gray-700">
              {file ? file.name : 'Drop your resume here or click to browse'}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Supports PDF, DOCX, or TXT • Max 5MB
            </p>
          </label>
        </div>
        
        {file && plainTextContent && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-gray-700">
                  {file.type === 'text/plain' ? 
                    'Text file ready' : 
                    `${file.type === 'application/pdf' ? 'PDF' : 'DOCX'} processed (${plainTextContent.length} characters)`}
                </span>
              </div>
              <button
                onClick={() => {setFile(null); setPlainTextContent('');}}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading || analyzing}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading 
                ? `Uploading... ${Math.round(progress)}%` 
                : analyzing 
                  ? 'Analyzing Resume...' 
                  : 'Upload & Analyze Resume'}
            </button>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200 flex items-start gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm text-gray-700">{successMessage}</span>
        </div>
      )}
      
      {analysis && (
        <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Resume Analysis</h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">Detected Skills</h4>
              {analysis.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {analysis.skills.map((skill, index) => (
                    <span key={index} className="bg-white text-gray-700 px-3 py-1.5 rounded-md text-xs border border-gray-200">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500 mb-3">
                    No specific skills were detected in your resume.
                  </p>
                  <div className="p-3 bg-white rounded-md border border-gray-200">
                    <div className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h5 className="text-xs font-medium text-gray-700">Resume Tip</h5>
                        <p className="text-xs text-gray-600 mt-1">
                          Include a dedicated "Skills" section with explicitly listed skills for better detection.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">Strengths</h4>
                <ul className="space-y-1.5">
                  {analysis.strengths.map((strength, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-gray-400 mt-1">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">Areas to Improve</h4>
                <ul className="space-y-1.5">
                  {analysis.weaknesses.map((weakness, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-gray-400 mt-1">•</span>
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">Recommendations</h4>
                <ul className="space-y-1.5">
                  {analysis.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-gray-400 mt-1">•</span>
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 