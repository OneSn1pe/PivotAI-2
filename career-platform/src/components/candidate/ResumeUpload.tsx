import React, { useState } from 'react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { analyzeResume } from '@/services/openai';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { ResumeAnalysis } from '@/types/user';

export default function ResumeUpload() {
  const { userProfile } = useAuth();
  const { uploadFile, uploading, progress } = useFileUpload();
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      
      // For text extraction (simplified - in a real app you'd use a PDF parser)
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        setResumeText(text);
      };
      reader.readAsText(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !userProfile) return;
    
    try {
      // Upload file to Firebase Storage
      const resumeUrl = await uploadFile(file, `resumes/${userProfile.uid}`);
      
      // Analyze resume with GPT-4
      setAnalyzing(true);
      const resumeAnalysis = await analyzeResume(resumeText);
      setAnalysis(resumeAnalysis);
      
      // Update user profile with resume URL and analysis
      await updateDoc(doc(db, 'users', userProfile.uid), {
        resumeUrl,
        resumeAnalysis,
      });
      
      setAnalyzing(false);
    } catch (error) {
      console.error('Error uploading resume:', error);
      setAnalyzing(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Upload Your Resume</h2>
      
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">
          Resume (PDF)
        </label>
        <input
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileChange}
          className="block w-full text-gray-700 border border-gray-300 rounded py-2 px-3"
        />
      </div>
      
      {file && (
        <button
          onClick={handleUpload}
          disabled={uploading || analyzing}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          {uploading ? `Uploading: ${Math.round(progress)}%` : analyzing ? 'Analyzing...' : 'Upload and Analyze'}
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