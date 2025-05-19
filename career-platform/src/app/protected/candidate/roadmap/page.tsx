'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/config/firebase';
import { CareerRoadmap, Milestone, CandidateProfile } from '@/types/user';
import { useRouter } from 'next/navigation';
import CareerRoadmapComponent from '@/components/candidate/CareerRoadmap';

export default function RoadmapPage() {
  const { userProfile } = useAuth();
  const candidateProfile = userProfile as CandidateProfile | null;
  const router = useRouter();
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const [loading, setLoading] = useState(true);

  // Add CSS to ensure navbar matches exactly
  useEffect(() => {
    // Add a style tag to ensure navbar displays exactly as in other pages
    const style = document.createElement('style');
    style.textContent = `
      /* Reset any potential custom styling */
      nav {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        z-index: 10 !important;
        width: 100% !important;
        flex-direction: row !important;
        height: auto !important;
        background: linear-gradient(to right, var(--tw-gradient-stops)) !important;
        --tw-gradient-from: #581c87 !important;
        --tw-gradient-to: #7e22ce !important;
        --tw-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1) !important;
        --tw-shadow-colored: 0 10px 15px -3px var(--tw-shadow-color), 0 4px 6px -4px var(--tw-shadow-color) !important;
        box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow) !important;
        --tw-shadow-color: rgba(168, 85, 247, 0.2) !important;
      }

      /* Exact container structure */
      nav > div.max-w-7xl {
        max-width: 80rem !important;
        margin-left: auto !important;
        margin-right: auto !important;
        padding-left: 1rem !important;
        padding-right: 1rem !important;
        position: relative !important;
      }

      /* Ornamental elements */
      nav > div > div.absolute.inset-0 {
        position: absolute !important;
        inset: 0 !important;
        overflow: hidden !important;
        pointer-events: none !important;
        opacity: 0.1 !important;
      }

      /* Main flex container for navbar content */
      nav > div > div.flex {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        height: 5rem !important;
      }
      
      /* Override any sidebar styles that might be affecting the roadmap navbar */
      .sidebar, aside {
        display: none !important;
      }
      
      /* Main content padding to account for navbar */
      .page-content {
        padding-top: 5rem !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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

  if (!roadmap) {
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
                onClick={() => router.push('/protected/candidate/roadmap/generator')}
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-4xl font-bold text-slate-800">Your Career Roadmap</h1>
        <button
          onClick={() => router.push('/protected/candidate/roadmap/generator')}
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