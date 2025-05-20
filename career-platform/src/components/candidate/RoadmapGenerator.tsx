import React, { useState, useEffect } from 'react';
import { ResumeAnalysis, TargetCompany, CareerRoadmap as RoadmapType, Milestone } from '@/types/user';
import { generateCareerRoadmap, deleteAllRoadmaps } from '@/services/openai';
import CareerRoadmap from './CareerRoadmap';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface RoadmapGeneratorProps {
  resumeAnalysis: ResumeAnalysis | null;
  onRoadmapGenerated: (roadmapId: string) => void;
}

const RoadmapGenerator: React.FC<RoadmapGeneratorProps> = ({ 
  resumeAnalysis,
  onRoadmapGenerated
}) => {
  const { userProfile } = useAuth();
  const [targetCompanies, setTargetCompanies] = useState<TargetCompany[]>([
    { name: '', position: '' }
  ]);
  const [generating, setGenerating] = useState(false);
  const [generatedRoadmap, setGeneratedRoadmap] = useState<RoadmapType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load existing target companies from user profile
  useEffect(() => {
    async function loadTargetCompanies() {
      if (!userProfile) return;
      
      try {
        setLoading(true);
        const userDoc = await getDoc(doc(db, 'users', userProfile.uid));
        
        if (userDoc.exists() && userDoc.data().targetCompanies) {
          const savedCompanies = userDoc.data().targetCompanies;
          
          if (savedCompanies.length > 0) {
            console.log('Loaded target companies from profile:', savedCompanies);
            setTargetCompanies(savedCompanies);
          }
        } else {
          console.log('No target companies found in user profile');
        }
      } catch (error) {
        console.error('Error loading target companies:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadTargetCompanies();
  }, [userProfile]);

  // Add a new empty target company field
  const addTargetCompany = () => {
    setTargetCompanies([...targetCompanies, { name: '', position: '' }]);
  };

  // Remove a target company at given index
  const removeTargetCompany = (index: number) => {
    if (targetCompanies.length <= 1) return;
    const newCompanies = [...targetCompanies];
    newCompanies.splice(index, 1);
    setTargetCompanies(newCompanies);
  };

  // Update target company data at given index
  const updateTargetCompany = (index: number, field: keyof TargetCompany, value: string) => {
    const newCompanies = [...targetCompanies];
    newCompanies[index] = { ...newCompanies[index], [field]: value };
    setTargetCompanies(newCompanies);
  };

  // Validate input before generating roadmap
  const validateInput = (): boolean => {
    // Check if we have resume analysis
    if (!resumeAnalysis) {
      setError('Please upload your resume first to generate a roadmap.');
      return false;
    }

    // Check if at least one target company has both name and position
    const hasValidTargetCompany = targetCompanies.some(
      company => company.name.trim() !== '' && company.position.trim() !== ''
    );

    if (!hasValidTargetCompany) {
      setError('Please provide at least one target company and position.');
      return false;
    }

    setError(null);
    return true;
  };

  // Generate roadmap based on resume analysis and target companies
  const handleGenerateRoadmap = async () => {
    if (!validateInput() || !resumeAnalysis || !userProfile) return;
    
    // Ensure resumeAnalysis has all required fields with fallbacks
    const validatedResumeAnalysis = {
      ...resumeAnalysis,
      skills: Array.isArray(resumeAnalysis.skills) ? resumeAnalysis.skills : [],
      experience: Array.isArray(resumeAnalysis.experience) ? resumeAnalysis.experience : [],
      education: Array.isArray(resumeAnalysis.education) ? resumeAnalysis.education : [],
      strengths: Array.isArray(resumeAnalysis.strengths) ? resumeAnalysis.strengths : [],
      weaknesses: Array.isArray(resumeAnalysis.weaknesses) ? resumeAnalysis.weaknesses : [],
      recommendations: Array.isArray(resumeAnalysis.recommendations) ? resumeAnalysis.recommendations : []
    };
    
    // Filter out empty target companies
    const validTargetCompanies = targetCompanies.filter(
      company => company.name.trim() !== '' && company.position.trim() !== ''
    );
    
    setGenerating(true);
    setError(null);
    
    try {
      // Save the valid target companies to the user's profile
      try {
        await updateDoc(doc(db, 'users', userProfile.uid), {
          targetCompanies: validTargetCompanies,
          updatedAt: new Date()
        });
        console.log('Successfully saved target companies to user profile');
      } catch (saveErr) {
        console.error('Error saving target companies to profile:', saveErr);
        // Continue with roadmap generation even if saving fails
      }
      
      // First delete any existing roadmaps for this candidate
      try {
        await deleteAllRoadmaps(userProfile.uid);
        console.log('Successfully deleted existing roadmaps');
      } catch (deleteErr) {
        console.warn('Error deleting existing roadmaps, continuing with generation:', deleteErr);
      }
      
      // Generate new roadmap
      const roadmap = await generateCareerRoadmap(
        validatedResumeAnalysis, 
        validTargetCompanies,
        userProfile.uid
      );
      
      setGeneratedRoadmap(roadmap);
      
      // Notify parent component
      onRoadmapGenerated(roadmap.id || userProfile.uid);
    } catch (err) {
      console.error('Error generating roadmap:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate roadmap. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4 text-slate-800">Generate Career Roadmap</h2>
        
        {!resumeAnalysis ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-md mb-4">
            <p className="text-amber-700">
              Please upload your resume first to generate a career roadmap.
            </p>
          </div>
        ) : (
          <>
            <p className="text-slate-600 mb-6">
              Enter the companies and positions you're targeting for your career path, and we'll generate a personalized roadmap based on your resume and goals.
            </p>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 text-slate-800">Target Companies</h3>
              
              {targetCompanies.map((company, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-4 mb-4 p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={company.name}
                      onChange={(e) => updateTargetCompany(index, 'name', e.target.value)}
                      placeholder="e.g. Google, Amazon"
                      className="w-full p-2 border border-slate-300 rounded focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Target Position
                    </label>
                    <input
                      type="text"
                      value={company.position}
                      onChange={(e) => updateTargetCompany(index, 'position', e.target.value)}
                      placeholder="e.g. Senior Developer, Product Manager"
                      className="w-full p-2 border border-slate-300 rounded focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeTargetCompany(index)}
                      disabled={targetCompanies.length <= 1}
                      className="p-2 text-red-500 hover:bg-red-50 rounded disabled:opacity-30"
                      aria-label="Remove target company"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addTargetCompany}
                className="text-teal-600 hover:text-teal-800 flex items-center"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add another target company
              </button>
            </div>
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}
            
            <button
              onClick={handleGenerateRoadmap}
              disabled={generating}
              className="w-full bg-teal-700 hover:bg-teal-800 text-white font-medium py-3 px-4 rounded shadow-button disabled:opacity-50 transition-all duration-300"
            >
              {generating ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Your Roadmap...
                </span>
              ) : 'Generate Career Roadmap'}
            </button>
            
            <p className="text-center text-slate-500 mt-2 text-sm">
              {generating ? (
                <span className="inline-flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Generation in progress... (Under 1 minute)
                </span>
              ) : (
                <span className="inline-flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Expected generation time: Under 1 minute
                </span>
              )}
            </p>
          </>
        )}
      </div>
      
      {/* Display the generated roadmap */}
      {generatedRoadmap && (
        <div className="bg-white rounded-lg shadow-lg p-6 border border-slate-200">
          <CareerRoadmap 
            roadmap={generatedRoadmap} 
            isEditable={true}
            onMilestoneToggle={async (milestoneId: string, completed: boolean) => {
              // Here you would typically update the milestone in your database
              // For now, we'll just update the local state
              setGeneratedRoadmap((prevRoadmap: RoadmapType | null) => {
                if (!prevRoadmap) return null;
                
                const updatedMilestones = prevRoadmap.milestones.map((milestone: Milestone) => 
                  milestone.id === milestoneId ? { ...milestone, completed } : milestone
                );
                
                return {
                  ...prevRoadmap,
                  milestones: updatedMilestones
                };
              });
              
              // Return a resolved promise since this prop expects a Promise
              return Promise.resolve();
            }}
          />
        </div>
      )}
    </div>
  );
};

export default RoadmapGenerator; 