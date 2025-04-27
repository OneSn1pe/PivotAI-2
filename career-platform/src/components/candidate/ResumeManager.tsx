import React, { useState, useCallback, useEffect } from 'react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { analyzeResume } from '@/services/openai';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, storage } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { ResumeAnalysis, CandidateProfile } from '@/types/user';
import { ref, getDownloadURL, listAll } from 'firebase/storage';

interface ResumeManagerProps {
  onUpdateComplete?: () => void;
}

export default function ResumeManager({ onUpdateComplete }: ResumeManagerProps) {
  const { userProfile } = useAuth();
  const candidateProfile = userProfile as CandidateProfile | null;
  const { uploadFile, uploading, progress } = useFileUpload();
  
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validatedResumeUrl, setValidatedResumeUrl] = useState<string | null>(null);
  const [validatingUrl, setValidatingUrl] = useState(false);
  
  // Validate resume URL on component mount
  useEffect(() => {
    validateResumeUrl();
  }, [candidateProfile?.resumeUrl]);
  
  // Function to validate resume URL
  const validateResumeUrl = async () => {
    if (!candidateProfile?.resumeUrl) return;
    
    setValidatingUrl(true);
    setError(null);
    
    try {
      // Try to fetch the URL directly first
      await fetch(candidateProfile.resumeUrl, { method: 'HEAD' })
        .then(response => {
          if (response.ok) {
            setValidatedResumeUrl(candidateProfile.resumeUrl || null);
            return;
          }
          throw new Error('URL not accessible');
        })
        .catch(async () => {
          // If direct fetch fails, try to find the most recent resume file in storage
          if (!userProfile?.uid) throw new Error('User not authenticated');
          
          const userResumesRef = ref(storage, `resumes/${userProfile.uid}`);
          
          try {
            // List all files in the user's resume directory
            const filesList = await listAll(userResumesRef);
            
            if (filesList.items.length === 0) {
              throw new Error('No resume files found in storage');
            }
            
            // Sort by name to get the most recent one (since we use timestamps in filenames)
            const sortedItems = [...filesList.items].sort((a, b) => {
              return b.name.localeCompare(a.name);
            });
            
            // Get the download URL of the most recent file
            const latestFileUrl = await getDownloadURL(sortedItems[0]);
            
            if (latestFileUrl !== candidateProfile.resumeUrl) {
              // Update the database with the correct URL
              await updateDoc(doc(db, 'users', userProfile.uid), {
                resumeUrl: latestFileUrl,
              });
              
              console.log('Updated resume URL in database to match most recent file');
            }
            
            setValidatedResumeUrl(latestFileUrl);
          } catch (storageErr) {
            console.error('Storage error:', storageErr);
            throw new Error('Could not find resume in storage');
          }
        });
    } catch (err) {
      console.error('Resume URL validation error:', err);
      setError('Cannot access resume file. It may have been moved or deleted.');
      setValidatedResumeUrl(null);
    } finally {
      setValidatingUrl(false);
    }
  };
  
  // Function to extract text from various file types
  const extractTextFromFile = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // For plain text files, read directly
      if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target && typeof e.target.result === 'string') {
            resolve(e.target.result);
          } else {
            reject(new Error('Failed to read text file'));
          }
        };
        reader.onerror = () => reject(new Error('Error reading text file'));
        reader.readAsText(file);
        return;
      }
      
      // For binary files like PDFs/DOCs, we'll use a simplified approach
      // In a real app, you'd use more robust parsing for different file types
      const reader = new FileReader();
      reader.onload = (e) => {
        // Create a placeholder text with file info
        // In a real app, you'd extract actual text from PDFs/DOCs
        const placeholderText = `Resume content from ${file.name} (${file.type})
        
        This is a resume file that will be processed for skills analysis.
        File name: ${file.name}
        File size: ${Math.round(file.size / 1024)} KB
        File type: ${file.type}
        
        The system will analyze this document to extract key skills, experience, 
        education, strengths, and areas for improvement.`;
        
        resolve(placeholderText);
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsArrayBuffer(file); // Read as binary
    });
  }, []);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setError(null);
      
      try {
        // Extract text from the resume file
        const text = await extractTextFromFile(selectedFile);
        setResumeText(text);
      } catch (err) {
        setError('Error reading file: ' + (err instanceof Error ? err.message : String(err)));
      }
    }
  };
  
  const handleUpload = async () => {
    if (!file || !userProfile) {
      setError('Please select a file to upload');
      return;
    }
    
    try {
      setError(null);
      setSuccessMessage(null);
      
      // Store the original file name in user-friendly format
      const originalFileName = file.name;
      
      // Create a unique path for the file that includes file extension
      const fileExtension = file.name.split('.').pop() || '';
      const timestamp = Date.now();
      const filePath = `resumes/${userProfile.uid}/${timestamp}_resume.${fileExtension}`;
      
      // Upload file to storage
      const resumeUrl = await uploadFile(file, filePath);
      
      // Analyze resume
      setAnalyzing(true);
      if (!resumeText.trim()) {
        throw new Error('Unable to extract text from the file. Please try a different format.');
      }
      
      const resumeAnalysis = await analyzeResume(resumeText);
      
      if (!resumeAnalysis) {
        throw new Error('Resume analysis failed. Please try again.');
      }
      
      setAnalysis(resumeAnalysis);
      
      // Update user profile with the new URL and analysis
      await updateDoc(doc(db, 'users', userProfile.uid), {
        resumeUrl,
        resumeFileName: originalFileName, // Store original filename for display
        resumeAnalysis,
        updatedAt: new Date(),
      });
      
      // Set the validated URL to the new URL
      setValidatedResumeUrl(resumeUrl);
      
      setAnalyzing(false);
      setSuccessMessage('Resume updated and analyzed successfully!');
      
      // Notify parent component of update
      if (onUpdateComplete) {
        onUpdateComplete();
      }
      
    } catch (err) {
      setAnalyzing(false);
      setError('Error: ' + (err instanceof Error ? err.message : String(err)));
    }
  };
  
  // Function to view resume - uses validated URL
  const handleViewResume = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    if (validatingUrl) {
      setError('Please wait, validating resume access...');
      return;
    }
    
    if (!validatedResumeUrl) {
      // Try to validate again
      validateResumeUrl();
      setError('Cannot access resume file. Trying to locate it...');
      return;
    }
    
    // Open the validated resume URL in a new tab
    window.open(validatedResumeUrl, '_blank');
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Manage Your Resume</h2>
      
      {candidateProfile?.resumeUrl && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-lg mb-2">Current Resume</h3>
          <p className="text-sm text-gray-600 mb-3">
            {candidateProfile.resumeFileName ? (
              <>File: <span className="font-medium">{candidateProfile.resumeFileName}</span> • </>
            ) : null}
            Last updated: {candidateProfile.updatedAt ? new Date(candidateProfile.updatedAt).toLocaleDateString() : 'Unknown'}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <a 
              href="#"
              onClick={handleViewResume}
              className={`inline-flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 ${validatingUrl ? 'opacity-50 cursor-wait' : ''}`}
              aria-disabled={validatingUrl}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {validatingUrl ? 'Validating...' : 'View Current Resume'}
            </a>
          </div>
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-3">Update Your Resume</h3>
        <p className="text-sm text-gray-600 mb-4">
          Upload a new resume to update your profile and get a fresh analysis of your skills and areas for improvement.
        </p>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            onChange={handleFileChange}
            className="hidden"
            id="resume-file"
            accept=".pdf,.doc,.docx,.txt"
          />
          <label
            htmlFor="resume-file"
            className="cursor-pointer block"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              {file ? file.name : 'Click to select a resume file'}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              PDF, DOC, DOCX, or TXT (max 5MB)
            </p>
          </label>
        </div>
        
        {file && (
          <div className="mt-4">
            <button
              onClick={handleUpload}
              disabled={uploading || analyzing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
            >
              {uploading 
                ? `Uploading... ${Math.round(progress)}%` 
                : analyzing 
                  ? 'Analyzing Resume...' 
                  : 'Update Resume'}
            </button>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg">
          {successMessage}
        </div>
      )}
      
      {analysis && (
        <div className="mt-6">
          <h3 className="font-semibold text-lg mb-3">Analysis Results</h3>
          
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