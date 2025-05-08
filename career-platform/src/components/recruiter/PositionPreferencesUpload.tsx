'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { RecruiterProfile, PositionPreferences } from '@/types/user';

// Dynamically import PDF.js only on client side
let pdfjsLib: any = null;

// Debug helper
const debug = {
  log: (...args: any[]) => console.log('[PositionPreferencesUpload]', ...args),
  error: (...args: any[]) => console.error('[PositionPreferencesUpload:ERROR]', ...args),
  warn: (...args: any[]) => console.warn('[PositionPreferencesUpload:WARN]', ...args),
};

interface PositionPreferencesUploadProps {
  onUpdateComplete?: () => void;
  currentPositions?: string[];
}

export default function PositionPreferencesUpload({ 
  onUpdateComplete,
  currentPositions = []
}: PositionPreferencesUploadProps) {
  const { userProfile, updateUserProfile } = useAuth();
  const recruiterProfile = userProfile as RecruiterProfile | null;
  const { uploadFile, uploading, progress } = useFileUpload();
  
  // Form states
  const [positionTitle, setPositionTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [pdfText, setPdfText] = useState('');
  
  // Extracted content states (hidden from user but still needed)
  const [description, setDescription] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [preferredSkills, setPreferredSkills] = useState('');
  const [careerPath, setCareerPath] = useState('');
  const [learningResources, setLearningResources] = useState('');
  
  // UI states
  const [isPdfJsLoaded, setIsPdfJsLoaded] = useState(false);
  const [processingFile, setProcessingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [existingPositionData, setExistingPositionData] = useState<PositionPreferences | null>(null);
  
  // Load PDF.js dynamically on client side
  useEffect(() => {
    async function loadPdfJs() {
      try {
        if (typeof window !== 'undefined' && !pdfjsLib) {
          const pdfjs = await import('pdfjs-dist');
          pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
          pdfjsLib = pdfjs;
          setIsPdfJsLoaded(true);
          debug.log('PDF.js loaded successfully');
        }
      } catch (err) {
        debug.error('Error loading PDF.js:', err);
        setError('Failed to load PDF processing library. Please try again later.');
      }
    }
    
    loadPdfJs();
  }, []);
  
  // Load existing position data when position is selected
  useEffect(() => {
    if (positionTitle && recruiterProfile?.positionPreferences?.[positionTitle]) {
      const positionData = recruiterProfile.positionPreferences[positionTitle];
      setExistingPositionData(positionData);
      
      // Pre-fill form fields with existing data for hidden fields
      setDescription(positionData.description || '');
      setRequiredSkills(positionData.requiredSkills?.join(', ') || '');
      setPreferredSkills(positionData.preferredSkills?.join(', ') || '');
      setCareerPath(positionData.careerPath?.join(', ') || '');
      setLearningResources(positionData.learningResources?.join('\n') || '');
      
      debug.log('Loaded existing position data:', positionData);
    } else {
      // Reset form when selecting a new position
      setExistingPositionData(null);
      setDescription('');
      setRequiredSkills('');
      setPreferredSkills('');
      setCareerPath('');
      setLearningResources('');
    }
  }, [positionTitle, recruiterProfile]);
  
  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const selectedFile = files[0];
    setFile(selectedFile);
    setError(null);
    
    if (selectedFile.type === 'application/pdf') {
      setProcessingFile(true);
      try {
        await extractTextFromPdf(selectedFile);
      } catch (err) {
        debug.error('Error processing PDF:', err);
        setError('Failed to extract text from PDF. Please try another file.');
      } finally {
        setProcessingFile(false);
      }
    } else {
      setError('Please upload a PDF file');
    }
  };
  
  // Extract text from PDF
  const extractTextFromPdf = async (pdfFile: File) => {
    if (!isPdfJsLoaded || !pdfjsLib) {
      debug.warn('PDF.js not loaded yet');
      return;
    }
    
    try {
      debug.log('Extracting text from PDF');
      
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      
      // Process each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }
      
      debug.log(`Extracted ${fullText.length} characters from PDF`);
      setPdfText(fullText);
      
      // Try to populate form fields based on PDF content
      populateFieldsFromText(fullText);
    } catch (err) {
      debug.error('Error extracting text from PDF:', err);
      throw err;
    }
  };
  
  // Attempt to populate form fields from the PDF text using simple pattern matching
  const populateFieldsFromText = (text: string) => {
    // Simple extraction based on common headers in job descriptions
    const sections = {
      description: extractSection(text, ["job description", "position description", "about the role"]),
      required: extractSection(text, ["required skills", "requirements", "qualifications", "must have"]),
      preferred: extractSection(text, ["preferred skills", "nice to have", "desirable skills"]),
      career: extractSection(text, ["career path", "career progression", "growth opportunities"]),
      learning: extractSection(text, ["learning resources", "training", "development resources"])
    };
    
    if (sections.description) setDescription(sections.description);
    if (sections.required) setRequiredSkills(sections.required);
    if (sections.preferred) setPreferredSkills(sections.preferred);
    if (sections.career) setCareerPath(sections.career);
    if (sections.learning) setLearningResources(sections.learning);
  };
  
  // Helper function to extract sections from text
  const extractSection = (text: string, possibleHeaders: string[]): string => {
    const lowerText = text.toLowerCase();
    
    for (const header of possibleHeaders) {
      const headerIndex = lowerText.indexOf(header);
      if (headerIndex !== -1) {
        // Find the start of the section (after the header)
        const sectionStart = headerIndex + header.length;
        
        // Look for the next potential header or section break
        const nextSection = findNextSectionStart(lowerText, sectionStart);
        
        // Extract the section text
        return text.substring(sectionStart, nextSection).trim();
      }
    }
    
    return '';
  };
  
  // Helper to find next section start
  const findNextSectionStart = (text: string, startFrom: number): number => {
    // Common section headers/delimiters
    const sectionDelimiters = [
      "required skills", "requirements", "qualifications", 
      "preferred skills", "nice to have", "responsibilities",
      "about the company", "who we are", "about us",
      "career path", "learning resources", "apply now"
    ];
    
    let earliestIndex = text.length;
    
    for (const delimiter of sectionDelimiters) {
      const index = text.indexOf(delimiter, startFrom + 1);
      if (index !== -1 && index < earliestIndex) {
        earliestIndex = index;
      }
    }
    
    return earliestIndex;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recruiterProfile) {
      setError('You must be logged in as a recruiter to upload position preferences');
      return;
    }
    
    if (!positionTitle) {
      setError('Please enter a position title');
      return;
    }
    
    try {
      setError(null);
      setSuccessMessage(null);
      
      // Create position preferences object
      const positionPrefs: PositionPreferences = {
        title: positionTitle,
        description: description.trim(),
        requiredSkills: requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
        preferredSkills: preferredSkills.split(',').map(s => s.trim()).filter(Boolean),
        careerPath: careerPath.split(',').map(s => s.trim()).filter(Boolean),
        learningResources: learningResources.split('\n').map(s => s.trim()).filter(Boolean),
        createdAt: existingPositionData?.createdAt || new Date(),
        updatedAt: new Date()
      };
      
      // If file was uploaded, store it in Firebase
      if (file) {
        const uniqueId = `${recruiterProfile.uid}_${Date.now()}`;
        const filePath = `position_preferences/${recruiterProfile.uid}/${uniqueId}_${positionTitle.replace(/\s+/g, '_')}.pdf`;
        
        debug.log(`Uploading position preferences PDF to path: ${filePath}`);
        const pdfUrl = await uploadFile(file, filePath);
        
        // Add file information to position preferences
        positionPrefs.uploadedDocUrl = pdfUrl;
        positionPrefs.uploadedFileName = file.name;
      }
      
      // Update the recruiter's profile
      const userDocRef = doc(db, 'users', recruiterProfile.uid);
      
      // Get current position preferences or initialize if not exists
      const currentPrefs = recruiterProfile.positionPreferences || {};
      
      // Update with new position preferences
      await updateDoc(userDocRef, {
        positionPreferences: {
          ...currentPrefs,
          [positionTitle]: positionPrefs
        }
      });
      
      debug.log('Position preferences saved successfully');
      setSuccessMessage('Position preferences saved successfully!');
      
      // Reset form
      setPositionTitle('');
      setFile(null);
      setPdfText('');
      
      // Refresh user profile data
      if (updateUserProfile) {
        await updateUserProfile();
      }
      
      // Call the callback if provided
      if (onUpdateComplete) {
        onUpdateComplete();
      }
    } catch (err) {
      debug.error('Error saving position preferences:', err);
      setError('Failed to save position preferences. Please try again.');
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Upload Position Preferences</h2>
      <p className="text-sm text-gray-600 mb-6">
        Upload position preferences to help generate better roadmaps for candidates interested in positions at your company.
      </p>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {successMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Position Title
          </label>
          <input
            type="text"
            value={positionTitle}
            onChange={(e) => setPositionTitle(e.target.value)}
            placeholder="Enter position title"
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload Position Description PDF
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4h-12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                  <span>Upload a file</span>
                  <input 
                    id="file-upload" 
                    name="file-upload" 
                    type="file" 
                    className="sr-only" 
                    accept="application/pdf"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PDF up to 10MB</p>
              
              {file && (
                <p className="text-sm text-gray-800 font-medium">
                  Selected: {file.name}
                </p>
              )}
              
              {processingFile && (
                <div className="mt-2 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                  <p className="text-sm text-gray-600">Processing PDF...</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div>
          <button
            type="submit"
            disabled={uploading || processingFile}
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading {Math.round(progress)}%
              </>
            ) : processingFile ? (
              'Processing PDF...'
            ) : (
              'Save Position Preferences'
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 