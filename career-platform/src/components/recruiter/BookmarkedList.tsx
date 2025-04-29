'use client';

import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { CandidateProfile, RecruiterProfile } from '@/types/user';
import CandidateCard from './CandidateCard';

interface BookmarkedListProps {
  limit?: number;
  onViewAll?: () => void;
}

export default function BookmarkedList({ limit, onViewAll }: BookmarkedListProps) {
  const { userProfile } = useAuth();
  const recruiterProfile = userProfile as RecruiterProfile | null;
  const [bookmarkedCandidates, setBookmarkedCandidates] = useState<CandidateProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBookmarkedCandidates() {
      if (!recruiterProfile || !recruiterProfile.bookmarkedCandidates) {
        setLoading(false);
        return;
      }
      
      try {
        const candidatesData: CandidateProfile[] = [];
        
        // Apply limit if provided
        const bookmarkIds = limit 
          ? recruiterProfile.bookmarkedCandidates.slice(0, limit) 
          : recruiterProfile.bookmarkedCandidates;
        
        for (const candidateId of bookmarkIds) {
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
  }, [recruiterProfile, limit]);

  const handleRemoveBookmark = async (candidateId: string) => {
    if (!recruiterProfile) return;
    
    try {
      // Update local state
      setBookmarkedCandidates(bookmarkedCandidates.filter(c => c.uid !== candidateId));
      
      // Update in Firestore
      const updatedBookmarks = recruiterProfile.bookmarkedCandidates?.filter((id: string) => id !== candidateId) || [];
      
      await updateDoc(doc(db, 'users', recruiterProfile.uid), {
        bookmarkedCandidates: updatedBookmarks,
      });
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (bookmarkedCandidates.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-gray-500">No bookmarked candidates yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-4">
        {bookmarkedCandidates.map((candidate, index) => (
          <CandidateCard
            key={index}
            candidate={candidate}
            isBookmarked={true}
            onBookmarkToggle={handleRemoveBookmark}
            recruiterUid={recruiterProfile?.uid}
            compact={true}
          />
        ))}
      </div>
      
      {onViewAll && (
        <div className="mt-4 text-center">
          <button 
            onClick={onViewAll}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View All Bookmarked Candidates
          </button>
        </div>
      )}
    </div>
  );
}