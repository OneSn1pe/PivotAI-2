'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { CandidateProfile, CareerRoadmap, RecruiterProfile } from '@/types/user';
import CareerRoadmapComponent from '@/components/candidate/CareerRoadmap';

export default function CandidateDetailPage() {
  const { userProfile } = useAuth();
  const recruiterProfile = userProfile as RecruiterProfile | null;
  const router = useRouter();
  const params = useParams();
  const candidateId = params.id as string;
  
  const [candidate, setCandidate] = useState<CandidateProfile | null>(null);
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Ensure we have a candidateId and the recruiter is authenticated
    if (!candidateId || !recruiterProfile) {
      setError(!candidateId ? 'Candidate ID not provided' : 'Authentication required');
      setLoading(false);
      return;
    }
    
    async function fetchCandidateData() {
      try {
        setLoading(true);
        
        // Fetch candidate profile
        const candidateDocRef = doc(db, 'users', candidateId);
        const candidateDocSnap = await getDoc(candidateDocRef);
        
        if (!candidateDocSnap.exists()) {
          setError('Candidate not found');
          setLoading(false);
          return;
        }
        
        const candidateData = candidateDocSnap.data() as CandidateProfile;
        setCandidate(candidateData);
        
        // Fetch candidate's roadmap
        const roadmapQuery = query(
          collection(db, 'roadmaps'),
          where('candidateId', '==', candidateId)
        );
        
        const roadmapSnapshot = await getDocs(roadmapQuery);
        
        if (!roadmapSnapshot.empty) {
          const roadmapDoc = roadmapSnapshot.docs[0];
          setRoadmap({
            ...roadmapDoc.data() as CareerRoadmap,
            id: roadmapDoc.id,
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching candidate data:', err);
        setError('Failed to load candidate information. Please try again later.');
        setLoading(false);
      }
    }
    
    fetchCandidateData();
  }, [candidateId, recruiterProfile]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
          <h2 className="text-xl font-bold text-red-700 mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  if (!candidate) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg text-center">
          <h2 className="text-xl font-bold text-yellow-700 mb-2">Candidate Not Found</h2>
          <p className="text-yellow-600">The candidate you're looking for could not be found.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  // Check if the candidate has the recruiter's company as a target
  const isInterestedInCompany = candidate.targetCompanies?.some(company => {
    return typeof company === 'string' 
      ? company === recruiterProfile?.company 
      : company.name === recruiterProfile?.company;
  });
  
  // Get target position for the recruiter's company
  const targetPosition = candidate.targetCompanies?.find(company => {
    return typeof company === 'object' && company.name === recruiterProfile?.company;
  });
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold">{candidate.displayName}'s Profile</h1>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Candidate Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Candidate Information</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm text-gray-500">Name</h3>
                <p className="font-medium">{candidate.displayName}</p>
              </div>
              
              <div>
                <h3 className="text-sm text-gray-500">Email</h3>
                <p className="font-medium">{candidate.email}</p>
              </div>
              
              {isInterestedInCompany && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-700">Interested in Your Company</h3>
                  {targetPosition && typeof targetPosition === 'object' && (
                    <p className="text-blue-800 font-medium mt-1">
                      Position: {targetPosition.position}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Skills Section */}
          {candidate.resumeAnalysis?.skills && candidate.resumeAnalysis.skills.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {candidate.resumeAnalysis.skills.map((skill, index) => (
                  <span 
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Experience Section */}
          {candidate.resumeAnalysis?.experience && candidate.resumeAnalysis.experience.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Experience</h2>
              <ul className="space-y-3 list-disc pl-5">
                {candidate.resumeAnalysis.experience.map((experience, index) => (
                  <li key={index} className="text-gray-700">{experience}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Strengths & Weaknesses Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {candidate.resumeAnalysis?.strengths && candidate.resumeAnalysis.strengths.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4">Strengths</h2>
                <ul className="space-y-2 list-disc pl-5">
                  {candidate.resumeAnalysis.strengths.map((strength, index) => (
                    <li key={index} className="text-gray-700">{strength}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {candidate.resumeAnalysis?.weaknesses && candidate.resumeAnalysis.weaknesses.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4">Areas to Improve</h2>
                <ul className="space-y-2 list-disc pl-5">
                  {candidate.resumeAnalysis.weaknesses.map((weakness, index) => (
                    <li key={index} className="text-gray-700">{weakness}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        {/* Right column - Career Roadmap */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Career Roadmap</h2>
            
            {roadmap ? (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Progress Summary</h3>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full"
                      style={{ 
                        width: `${Math.round(
                          (roadmap.milestones.filter(m => m.completed).length / roadmap.milestones.length) * 100
                        )}%` 
                      }}
                    ></div>
                  </div>
                  <div className="mt-2 text-right">
                    <span className="text-blue-600 font-semibold">
                      {roadmap.milestones.filter(m => m.completed).length} of {roadmap.milestones.length} completed
                    </span>
                  </div>
                </div>
                
                <CareerRoadmapComponent 
                  roadmap={roadmap} 
                  isEditable={false} // Recruiters can view but not edit
                />
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500">
                  This candidate hasn't generated a career roadmap yet.
                </p>
              </div>
            )}
          </div>
          
          {/* Recommendations Section */}
          {candidate.resumeAnalysis?.recommendations && candidate.resumeAnalysis.recommendations.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Recommended Next Steps</h2>
              <ul className="space-y-3 list-disc pl-5">
                {candidate.resumeAnalysis.recommendations.map((recommendation, index) => (
                  <li key={index} className="text-gray-700">{recommendation}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 