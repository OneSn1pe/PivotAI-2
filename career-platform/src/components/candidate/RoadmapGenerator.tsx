import React, { useState, useEffect } from 'react';
import { ResumeAnalysis, TargetCompany, CareerRoadmap as RoadmapType, Milestone } from '@/types/user';
import { generateCareerRoadmap } from '@/services/openai';
import CareerRoadmap from './CareerRoadmap';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
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
  const [progress, setProgress] = useState(0);
  const [currentRoadmapId, setCurrentRoadmapId] = useState<string | null>(null);

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
            setTargetCompanies(savedCompanies);
          }
        }
      } catch (error) {
        console.error('Error loading target companies:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadTargetCompanies();
  }, [userProfile]);

  // Listen for roadmap updates when generating
  useEffect(() => {
    if (!currentRoadmapId) return;

    const unsubscribe = onSnapshot(doc(db, 'roadmaps', currentRoadmapId), (doc) => {
      if (doc.exists()) {
        const roadmapData = doc.data() as RoadmapType;
        setGeneratedRoadmap(roadmapData);
        
        // Update progress based on number of milestones generated
        const milestoneCount = roadmapData.milestones?.length || 0;
        setProgress((milestoneCount / 5) * 100);
        
        // If all milestones are generated, stop listening
        if (milestoneCount === 5) {
          setGenerating(false);
          setProgress(100);
          onRoadmapGenerated(currentRoadmapId);
        }
      }
    });

    return () => unsubscribe();
  }, [currentRoadmapId, onRoadmapGenerated]);

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
    if (!resumeAnalysis) {
      setError('Please upload your resume first to generate a roadmap.');
      return false;
    }

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
    
    const validatedResumeAnalysis = {
      ...resumeAnalysis,
      skills: Array.isArray(resumeAnalysis.skills) ? resumeAnalysis.skills : [],
      experience: Array.isArray(resumeAnalysis.experience) ? resumeAnalysis.experience : [],
      education: Array.isArray(resumeAnalysis.education) ? resumeAnalysis.education : [],
      strengths: Array.isArray(resumeAnalysis.strengths) ? resumeAnalysis.strengths : [],
      weaknesses: Array.isArray(resumeAnalysis.weaknesses) ? resumeAnalysis.weaknesses : [],
      recommendations: Array.isArray(resumeAnalysis.recommendations) ? resumeAnalysis.recommendations : []
    };
    
    const validTargetCompanies = targetCompanies.filter(
      company => company.name.trim() !== '' && company.position.trim() !== ''
    );
    
    setGenerating(true);
    setError(null);
    setProgress(0);
    
    try {
      const roadmap = await generateCareerRoadmap(
        validatedResumeAnalysis, 
        validTargetCompanies,
        userProfile.uid
      );
      
      if (roadmap && roadmap.id) {
        setCurrentRoadmapId(roadmap.id);
      }
    } catch (err) {
      console.error('Error generating roadmap:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate roadmap. Please try again.');
      setGenerating(false);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Generate Career Roadmap</h2>
        
        {!resumeAnalysis ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md mb-4">
            <p className="text-yellow-700">
              Please upload your resume first to generate a career roadmap.
            </p>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-6">
              Enter the companies and positions you're targeting for your career path, and we'll generate a personalized roadmap based on your resume and goals.
            </p>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Target Companies</h3>
              {targetCompanies.map((company, index) => (
                <div key={index} className="flex gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Company Name"
                    value={company.name}
                    onChange={(e) => updateTargetCompany(index, 'name', e.target.value)}
                    className="flex-1 p-2 border rounded"
                  />
                  <input
                    type="text"
                    placeholder="Position"
                    value={company.position}
                    onChange={(e) => updateTargetCompany(index, 'position', e.target.value)}
                    className="flex-1 p-2 border rounded"
                  />
                  {targetCompanies.length > 1 && (
                    <button
                      onClick={() => removeTargetCompany(index)}
                      className="p-2 text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addTargetCompany}
                className="text-blue-500 hover:text-blue-700"
              >
                + Add Another Company
              </button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {generating && (
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-blue-700">Generating Roadmap...</span>
                  <span className="text-sm font-medium text-blue-700">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            <button
              onClick={handleGenerateRoadmap}
              disabled={generating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
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
          </>
        )}
      </div>
      
      {generatedRoadmap && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <CareerRoadmap 
            roadmap={generatedRoadmap} 
            isEditable={true}
            onMilestoneToggle={async (milestoneId: string, completed: boolean) => {
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
              
              return Promise.resolve();
            }}
          />
        </div>
      )}
    </div>
  );
};

export default RoadmapGenerator; 