'use client';

import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { CandidateProfile } from '@/types/user';

export default function BookmarkedCandidatesPage() {
  const { userProfile } = useAuth();
  const [bookmarkedCandidates, setBookmarkedCandidates] = useState<CandidateProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBookmarkedCandidates() {
      if (!userProfile || !userProfile.bookmarkedCandidates) {
        setLoading(false);
        return;
      }
      
      try {
        const candidatesData: CandidateProfile[] = [];
        
        for (const candidateId of userProfile.bookmarkedCandidates) {
          const candidateDoc = await getDoc(doc(db, 'users', candidateId));
          
          if (candidateDoc.exists()) {
            candidatesData.push(candidateDoc.data() as CandidateProfile);
          }
        }
        
        setBookmarkedCandidates(candidatesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching bookmarked candidates:', error);
        setLoading(false);
      }
    }
    
    fetchBookmarkedCandidates();
  }, [userProfile]);

  const handleRemoveBookmark = async (candidateId: string) => {
    if (!userProfile) return;
    
    try {
      // Update local state
      setBookmarkedCandidates(bookmarkedCandidates.filter(c => c.uid !== candidateId));
      
      // Update in Firestore
      const updatedBookmarks = userProfile.bookmarkedCandidates?.filter(id => id !== candidateId) || [];
      
      await updateDoc(doc(db, 'users', userProfile.uid), {
        bookmarkedCandidates: updatedBookmarks,
      });
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Bookmarked Candidates</h1>
      
      {bookmarkedCandidates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarkedCandidates.map((candidate, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold">{candidate.displayName}</h2>
                <button
                  onClick={() => handleRemoveBookmark(candidate.uid)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
              
              {candidate.resumeAnalysis?.skills && (
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {candidate.resumeAnalysis.skills.map((skill, skillIndex) => (
                      <span 
                        key={skillIndex}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {candidate.jobPreferences?.roles && (
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Looking for</h3>
                  <div className="flex flex-wrap gap-2">
                    {candidate.jobPreferences.roles.map((role, roleIndex) => (
                      <span 
                        key={roleIndex}
                        className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-6">
                <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">
                  View Full Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <p className="text-gray-600 mb-4">You haven't bookmarked any candidates yet.</p>
          <button
            onClick={() => window.location.href = '/recruiter/search'}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Search Candidates
          </button>
        </div>
      )}
    </div>
  );
}