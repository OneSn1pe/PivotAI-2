'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/config/firebase';
import { CareerRoadmap, Milestone } from '@/types/user';
import { useRouter } from 'next/navigation';

export default function RoadmapPage() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const [loading, setLoading] = useState(true);

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

  const handleToggleMilestone = async (index: number) => {
    if (!roadmap) return;
    
    try {
      // Create a new milestones array with the updated milestone
      const updatedMilestones = [...roadmap.milestones];
      updatedMilestones[index] = {
        ...updatedMilestones[index],
        completed: !updatedMilestones[index].completed,
      };
      
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
    } catch (error) {
      console.error('Error updating milestone:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">No Career Roadmap Found</h2>
          <p className="text-gray-600 mb-6">
            To generate your personalized career roadmap, please complete your profile
            and set your job preferences.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => router.push('/candidate/profile')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Complete Profile
            </button>
            <button
              onClick={() => router.push('/candidate/preferences')}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
            >
              Set Job Preferences
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Career Roadmap</h1>
      
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
      
      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-1 bg-gray-300"></div>
        
        {roadmap.milestones.map((milestone, index) => (
          <div key={index} className="relative mb-12">
            <div 
              className={`absolute left-8 transform -translate-x-1/2 w-4 h-4 rounded-full z-10 ${
                milestone.completed ? 'bg-green-500' : 'bg-blue-500'
              }`}
            ></div>
            
            <div className="ml-16 bg-white p-6 rounded-lg shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{milestone.title}</h3>
                <span className="text-gray-500">{milestone.timeframe}</span>
              </div>
              
              <p className="text-gray-700 mb-4">{milestone.description}</p>
              
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Skills to Acquire:</h4>
                <div className="flex flex-wrap gap-2">
                  {milestone.skills.map((skill, skillIndex) => (
                    <span 
                      key={skillIndex}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              
              <button
                onClick={() => handleToggleMilestone(index)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  milestone.completed
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                }`}
              >
                {milestone.completed ? 'Completed ✓' : 'Mark as Completed'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}