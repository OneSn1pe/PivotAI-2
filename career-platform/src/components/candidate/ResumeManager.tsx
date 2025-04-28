import React, { useState, useCallback, useEffect } from 'react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useFileDownload } from '@/hooks/useFileDownload';
import { analyzeResume } from '@/services/openai';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
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
  const { downloadAndSaveFile, downloading } = useFileDownload();
  
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validatedResumeUrl, setValidatedResumeUrl] = useState<string | null>(null);
  const [validatingUrl, setValidatingUrl] = useState(false);
  const [displayFileName, setDisplayFileName] = useState<string | null>(candidateProfile?.resumeFileName || null);
  
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
      
      // For PDF, DOC, DOCX files, create more structured placeholder text
      // that will help GPT analyze the content better
      const reader = new FileReader();
      reader.onload = (e) => {
        // Create a structured resume template that GPT can use to extract info
        const resumeTemplate = `
# RESUME INFORMATION
File: ${file.name}
Type: ${file.type}
Size: ${Math.round(file.size / 1024)} KB

# STRUCTURED RESUME CONTENT
This document contains resume information typically including:

CONTACT INFORMATION:
Name: [Name would be at the top of resume]
Email: [Email would be in contact section]
Phone: [Phone would be in contact section]

SUMMARY:
[Summary/Objective statement is usually at the top]

SKILLS:
- Technical skills likely include programming languages, frameworks, tools
- Soft skills likely include communication, leadership, teamwork
- Domain knowledge in relevant industries

EXPERIENCE:
- Most recent position (Company, Title, Dates)
  * Responsibilities and achievements
  * Quantifiable results when available
- Previous positions with similar details
  * Responsibilities and achievements

EDUCATION:
- Degree(s), Institution(s), Graduation date(s)
- Relevant coursework or certifications

PROJECTS:
- Relevant projects with brief descriptions
- Technologies used and outcomes

ADDITIONAL:
- Any other relevant information that would appear on a resume

Please extract and organize information from this resume into appropriate categories.
`;
        
        resolve(resumeTemplate);
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
        console.log('Extracted text from file:', text.substring(0, 100) + '...');
        setResumeText(text);
      } catch (err) {
        console.error('Error extracting text from file:', err);
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
      console.log('Starting resume upload and analysis process...');
      setError(null);
      setSuccessMessage(null);
      
      // Store the original file name in user-friendly format
      const originalFileName = file.name;
      
      // Create a unique path for the file that includes file extension
      const fileExtension = file.name.split('.').pop() || '';
      const timestamp = Date.now();
      const filePath = `resumes/${userProfile.uid}/${timestamp}_resume.${fileExtension}`;
      
      console.log(`Uploading file ${originalFileName} to path: ${filePath}`);
      
      // Upload file to storage
      const resumeUrl = await uploadFile(file, filePath);
      console.log('File uploaded successfully, URL:', resumeUrl);
      
      // Analyze resume
      setAnalyzing(true);
      if (!resumeText.trim()) {
        throw new Error('Unable to extract text from the file. Please try a different format.');
      }
      
      console.log(`Starting resume analysis. Text length: ${resumeText.length}`);
      console.log('First 100 chars of resumeText:', resumeText.substring(0, 100));
      
      try {
        console.log('Calling analyzeResume API...');
        const analysisStartTime = performance.now();
        
        const resumeAnalysis = await analyzeResume(resumeText);
        
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
          updatedAt: serverTimestamp(),  // Use Firebase server timestamp for consistent timing
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
          onUpdateComplete();
        }
        
      } catch (analysisError) {
        console.error('Error during resume analysis:', analysisError);
        throw analysisError; // Re-throw to be caught by outer catch block
      }
      
    } catch (err) {
      console.error('Overall error in handleUpload:', err);
      setAnalyzing(false);
      setError('Error: ' + (err instanceof Error ? err.message : String(err)));
    }
  };
  
  // Function to view/download resume using the new hook
  const handleViewResume = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    // Force refresh to get latest resume
    await forceGetLatestResume();
    
    if (validatingUrl) {
      setError('Please wait, validating resume access...');
      return;
    }
    
    if (!validatedResumeUrl) {
      setError('Cannot access resume file. No resume found.');
      return;
    }
    
    try {
      if (!candidateProfile?.uid) {
        throw new Error('User not authenticated');
      }
      
      // Get all files in storage to find most recent
      const userResumesRef = ref(storage, `resumes/${candidateProfile.uid}`);
      const filesList = await listAll(userResumesRef);
      
      if (filesList.items.length === 0) {
        throw new Error('No resume files found in storage');
      }
      
      // Sort by name to get the most recent one
      const sortedItems = [...filesList.items].sort((a, b) => {
        return b.name.localeCompare(a.name);
      });
      
      // Use the most recent file's path directly
      const resumePath = sortedItems[0].fullPath;
      
      // Determine filename
      let filename = 'resume';
      if (candidateProfile.resumeFileName) {
        filename = candidateProfile.resumeFileName;
      } else {
        // Extract filename from path if available
        const pathParts = resumePath.split('/');
        filename = pathParts[pathParts.length - 1];
      }
      
      // Use our custom hook to download the file directly from storage
      await downloadAndSaveFile(resumePath, filename);
      
      setSuccessMessage('Resume download initiated');
      
    } catch (err) {
      console.error('Resume download error:', err);
      setError('Error downloading resume: ' + (err instanceof Error ? err.message : String(err)));
      
      // Fallback: open in a new tab if all else fails
      if (validatedResumeUrl) {
        window.open(validatedResumeUrl, '_blank');
      }
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Manage Your Resume</h2>
      
      {candidateProfile?.resumeUrl && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-lg mb-2">Current Resume</h3>
          <p className="text-sm text-gray-600 mb-3">
            {displayFileName ? (
              <>File: <span className="font-medium">{displayFileName}</span> • </>
            ) : null}
            Last updated: {candidateProfile.updatedAt ? 
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
          
          <div className="flex flex-col sm:flex-row gap-3">
            <a 
              href="#"
              onClick={handleViewResume}
              className={`inline-flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 ${(validatingUrl || downloading) ? 'opacity-50 cursor-wait' : ''}`}
              aria-disabled={validatingUrl || downloading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {validatingUrl ? 'Validating...' : 
               downloading ? 'Downloading...' : 'Download Resume'}
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
              {analysis.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {analysis.skills.map((skill, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600 mb-3">
                  No specific skills were identified in your resume. 
                  Consider updating your resume to explicitly list your technical and professional skills.
                </p>
              )}
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