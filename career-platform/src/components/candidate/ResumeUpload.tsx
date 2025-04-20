import React, { useState } from 'react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { analyzeResume } from '@/services/openai';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { ResumeAnalysis, CandidateProfile } from '@/types/user';

export default function ResumeUpload() {
  const { userProfile } = useAuth();
  const { uploadFile, uploading, progress } = useFileUpload();
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const extractTextFromFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          if (!event.target || !event.target.result) {
            reject(new Error('Failed to read file content'));
            return;
          }
          
          // For text files, we can use the result directly
          if (file.type === 'text/plain') {
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
            console.warn('Extracted text is too short, might be binary content');
            resolve(`This appears to be a binary or image-based file. 
            File name: ${file.name}
            File type: ${file.type}
            File size: ${file.size} bytes
            This is a resume for parsing. Please extract any visible text from this document.`);
          } else {
            resolve(cleanedText);
          }
        } catch (err) {
          console.error('Error extracting text:', err);
          reject(err);
        }
      };
      
      reader.onerror = () => {
        reject(new Error(`Failed to read file: ${file.name}`));
      };
      
      // Read as text for now, in a real app you'd use different methods based on file type
      reader.readAsText(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setError(null); // Clear any previous errors
      
      try {
        const extractedText = await extractTextFromFile(selectedFile);
        console.log('Extracted text length:', extractedText.length);
        setResumeText(extractedText);
      } catch (err) {
        console.error('Error reading file:', err);
        setError('Could not read the file content. Please try a different file format.');
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !userProfile) return;
    
    try {
      setError(null); // Clear any previous errors
      setSuccessMessage(null); // Clear any previous success messages
      
      // Upload file to Firebase Storage
      console.log('Starting file upload to Firebase Storage...');
      console.log('This will replace any existing resume file');
      const resumeUrl = await uploadFile(file, `resumes/${userProfile.uid}`);
      console.log('File uploaded successfully:', resumeUrl);
      
      // Analyze resume with GPT-4
      setAnalyzing(true);
      console.log('Analyzing resume text. Length:', resumeText.length);
      
      if (!resumeText || resumeText.trim() === '') {
        throw new Error('Unable to extract text from file. Please try a different file format.');
      }
      
      // Use a sample of the text for debugging
      console.log('Text sample:', resumeText.substring(0, 200) + '...');
      
      const resumeAnalysis = await analyzeResume(resumeText);
      setAnalysis(resumeAnalysis);
      console.log('Resume analysis complete:', resumeAnalysis);
      
      // Update user profile with resume URL and analysis
      await updateDoc(doc(db, 'users', userProfile.uid), {
        resumeUrl,
        resumeAnalysis,
      });
      
      console.log('User profile updated with resume data');
      setAnalyzing(false);
      setSuccessMessage('Resume uploaded and analyzed successfully! Previous resume (if any) has been replaced.');
    } catch (error: any) {
      console.error('Error uploading resume:', error);
      setError(error.message || 'Failed to process resume. Please try again.');
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
          {error}
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
          
          <div className="mb-4">
            <h4 className="font-bold">Skills</h4>
            <div className="flex flex-wrap gap-2 mt-1">
              {analysis.skills.map((skill, index) => (
                <span key={index} className="bg-gray-200 px-3 py-1 rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="font-bold">Strengths</h4>
            <ul className="list-disc pl-5 mt-1">
              {analysis.strengths.map((strength, index) => (
                <li key={index}>{strength}</li>
              ))}
            </ul>
          </div>
          
          <div className="mb-4">
            <h4 className="font-bold">Recommendations</h4>
            <ul className="list-disc pl-5 mt-1">
              {analysis.recommendations.map((recommendation, index) => (
                <li key={index}>{recommendation}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}