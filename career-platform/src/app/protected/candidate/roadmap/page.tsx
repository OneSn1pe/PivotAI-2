'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/config/firebase';
import { CareerRoadmap, Milestone, CandidateProfile } from '@/types/user';
import { useRouter } from 'next/navigation';
import RoadmapGenerator from '@/components/candidate/RoadmapGenerator';
import CareerRoadmapComponent from '@/components/candidate/CareerRoadmap';

export default function RoadmapPage() {
  const { userProfile } = useAuth();
  const candidateProfile = userProfile as CandidateProfile | null;
  const router = useRouter();
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGenerator, setShowGenerator] = useState(false);

  useEffect(() => {
    async function fetchRoadmap() {
      if (!userProfile) return;
      
      try {
        const roadmapQuery = query(
          collection(db, 'roadmaps'),
          where('candidateId', '==', userProfile.uid)
        );
        
        const roadmapSnapshot = await getDocs(roadmapQuery);
        
        if (!roadmapSnapshot.empty) {
          setRoadmap({
            ...roadmapSnapshot.docs[0].data() as CareerRoadmap,
            id: roadmapSnapshot.docs[0].id,
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching roadmap:', error);
        setLoading(false);
      }
    }
    
    fetchRoadmap();
  }, [userProfile]);

  const handleToggleMilestone = async (milestoneId: string, completed: boolean) => {
    if (!roadmap) return;
    
    try {
      // Find the milestone by ID
      const updatedMilestones = roadmap.milestones.map(milestone => 
        milestone.id === milestoneId ? { ...milestone, completed } : milestone
      );
      
      // Update the roadmap in state
      setRoadmap({
        ...roadmap,
        milestones: updatedMilestones,
        updatedAt: new Date(),
      });
      
      // Update in Firestore
      await updateDoc(doc(db, 'roadmaps', roadmap.id), {
        milestones: updatedMilestones,
        updatedAt: new Date(),
      });

      return Promise.resolve();
    } catch (error) {
      console.error('Error updating milestone:', error);
      return Promise.reject(error);
    }
  };

  const handleRoadmapGenerated = async (newRoadmapId: string) => {
    // Fetch the newly created roadmap
    try {
      const roadmapSnapshot = await getDocs(query(
        collection(db, 'roadmaps'),
        where('id', '==', newRoadmapId)
      ));
      
      if (!roadmapSnapshot.empty) {
        setRoadmap(roadmapSnapshot.docs[0].data() as CareerRoadmap);
      }
      
      setShowGenerator(false);
    } catch (error) {
      console.error('Error fetching new roadmap:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!roadmap && !showGenerator) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.push('/protected/candidate/dashboard')}
            className="text-blue-600 hover:text-blue-800 flex items-center mr-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </button>
        </div>
        <div className="text-center py-12 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">No Career Roadmap Found</h2>
          <p className="text-gray-600 mb-6">
            You can generate a personalized career roadmap based on your resume and career goals.
          </p>
          
          {candidateProfile?.resumeAnalysis ? (
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowGenerator(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                Generate Your Roadmap
              </button>
            </div>
          ) : (
            <div>
              <p className="text-yellow-700 mb-4">
                Please upload your resume first to generate a roadmap.
              </p>
              <button
                onClick={() => router.push('/protected/candidate/profile')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                Complete Your Profile
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (showGenerator) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.push('/protected/candidate/dashboard')}
            className="text-blue-600 hover:text-blue-800 flex items-center mr-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold">Create Your Career Roadmap</h1>
        </div>
        <RoadmapGenerator 
          resumeAnalysis={candidateProfile?.resumeAnalysis || null} 
          onRoadmapGenerated={handleRoadmapGenerated}
        />
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowGenerator(false)}
            className="text-gray-600 hover:text-gray-800 underline"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/protected/candidate/dashboard')}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold">Your Career Roadmap</h1>
        </div>
        <button
          onClick={() => setShowGenerator(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Generate New Roadmap
        </button>
      </div>
      
      {roadmap && (
        <div>
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Your Progress</h2>
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
            isEditable={true}
            onMilestoneToggle={handleToggleMilestone}
          />
        </div>
      )}
    </div>
  );
}