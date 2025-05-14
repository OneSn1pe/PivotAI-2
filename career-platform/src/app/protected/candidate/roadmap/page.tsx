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

  const handleRoadmapGenerated = async (roadmapId: string) => {
    // After regeneration, fetch the updated roadmap
    if (!userProfile) return;
    
    try {
      // Since roadmaps are now updated in place, we need to refetch from the candidateId
      const roadmapQuery = query(
        collection(db, 'roadmaps'),
        where('candidateId', '==', userProfile.uid)
      );
      
      const roadmapSnapshot = await getDocs(roadmapQuery);
      
      if (!roadmapSnapshot.empty) {
        const roadmapDoc = roadmapSnapshot.docs[0];
        setRoadmap({
          ...roadmapDoc.data() as CareerRoadmap,
          id: roadmapDoc.id,
        });
      }
      
      setShowGenerator(false);
    } catch (error) {
      console.error('Error fetching updated roadmap:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
          <div className="absolute -top-4 -left-4 cloud-sm opacity-30 animate-float-fast"></div>
          <div className="absolute -bottom-2 -right-4 cloud-sm opacity-20 animate-float-medium"></div>
        </div>
      </div>
    );
  }

  if (!roadmap && !showGenerator) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6 text-slate-800">Career Roadmap</h1>
        <div className="text-center py-12 bg-white/80 backdrop-filter backdrop-blur-md rounded-2xl shadow-xl shadow-sky-200/50 border border-slate-100">
          <h2 className="text-2xl font-bold mb-4 text-slate-800">No Career Roadmap Found</h2>
          <p className="text-slate-600 mb-6">
            You can generate a personalized career roadmap based on your resume and career goals.
          </p>
          
          {candidateProfile?.resumeAnalysis ? (
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowGenerator(true)}
                className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white px-6 py-3 rounded-full font-medium shadow-md shadow-sky-500/30 transition-all duration-300"
              >
                Generate Your Roadmap
              </button>
            </div>
          ) : (
            <div>
              <p className="text-amber-600 mb-4">
                Please upload your resume first to generate a roadmap.
              </p>
              <button
                onClick={() => router.push('/protected/candidate/profile')}
                className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white px-6 py-3 rounded-full font-medium shadow-md shadow-sky-500/30 transition-all duration-300"
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
        <h1 className="text-4xl font-bold mb-6 text-slate-800">Create Your Career Roadmap</h1>
        <div className="bg-white/80 backdrop-filter backdrop-blur-md p-6 rounded-2xl shadow-xl shadow-sky-200/50 border border-slate-100 mb-6">
          <RoadmapGenerator 
            resumeAnalysis={candidateProfile?.resumeAnalysis || null} 
            onRoadmapGenerated={handleRoadmapGenerated}
          />
        </div>
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowGenerator(false)}
            className="text-slate-600 hover:text-slate-800 underline transition-colors duration-300"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-4xl font-bold text-slate-800">Your Career Roadmap</h1>
        <button
          onClick={() => setShowGenerator(true)}
          className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white px-6 py-3 rounded-full font-medium shadow-md shadow-sky-500/30 transition-all duration-300"
        >
          Generate New Roadmap
        </button>
      </div>
      
      {roadmap && (
        <div>
          <div className="bg-white/80 backdrop-filter backdrop-blur-md p-6 rounded-2xl shadow-xl shadow-sky-200/50 mb-8 border border-slate-100 float-card">
            <h2 className="text-xl font-bold mb-4 text-slate-800">Your Career Altitude</h2>
            <div className="flex items-center">
              <div className="w-full bg-slate-200/60 rounded-full h-4 mr-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-sky-400 to-sky-600 h-4 rounded-full"
                  style={{ 
                    width: `${Math.round(
                      (roadmap.milestones.filter(m => m.completed).length / roadmap.milestones.length) * 100
                    )}%` 
                  }}
                ></div>
              </div>
              <span className="text-sky-700 font-semibold whitespace-nowrap">
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