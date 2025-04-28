'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { CareerRoadmap, CandidateProfile } from '@/types/user';
import CareerRoadmapComponent from '@/components/candidate/CareerRoadmap';

export default function CandidateRoadmapPage() {
  const { uid } = useParams();
  const router = useRouter();
  const [candidate, setCandidate] = useState<CandidateProfile | null>(null);
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch candidate profile
        const candidateDoc = await getDoc(doc(db, 'users', uid as string));
        if (candidateDoc.exists()) {
          setCandidate(candidateDoc.data() as CandidateProfile);
        }

        // Fetch roadmap
        const roadmapQuery = query(
          collection(db, 'roadmaps'),
          where('candidateId', '==', uid)
        );
        
        const roadmapSnapshot = await getDocs(roadmapQuery);
        if (!roadmapSnapshot.empty) {
          const roadmapData = roadmapSnapshot.docs[0].data() as CareerRoadmap;
          setRoadmap({
            ...roadmapData,
            id: roadmapSnapshot.docs[0].id,
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    }

    fetchData();
  }, [uid]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!candidate || !roadmap) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Roadmap Not Found</h2>
          <p className="text-gray-600 mb-6">
            This candidate hasn't generated a career roadmap yet.
          </p>
          <button
            onClick={() => router.back()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{candidate.displayName}'s Career Roadmap</h1>
          <p className="text-gray-600 mt-2">
            Progress: {Math.round((roadmap.milestones.filter(m => m.completed).length / roadmap.milestones.length) * 100)}%
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
        >
          Back to Profile
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <CareerRoadmapComponent roadmap={roadmap} readOnly={true} />
      </div>
    </div>
  );
} 