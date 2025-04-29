'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { CandidateProfile, UserRole, RecruiterProfile } from '@/types/user';
import CandidateCard from './CandidateCard';

export default function CandidateSearch() {
  const { userProfile } = useAuth();
  const recruiterProfile = userProfile as RecruiterProfile | null;
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [bookmarkedCandidates, setBookmarkedCandidates] = useState<string[]>([]);

  useEffect(() => {
    // Fetch all unique skills and roles from candidates
    async function fetchFilters() {
      try {
        const candidatesQuery = query(
          collection(db, 'users'),
          where('role', '==', UserRole.CANDIDATE)
        );
        
        const snapshot = await getDocs(candidatesQuery);
        const uniqueSkills = new Set<string>();
        const uniqueRoles = new Set<string>();
        
        snapshot.docs.forEach(doc => {
          const data = doc.data() as CandidateProfile;
          if (data.resumeAnalysis?.skills) {
            data.resumeAnalysis.skills.forEach(skill => uniqueSkills.add(skill));
          }
          
          if (data.jobPreferences?.roles) {
            data.jobPreferences.roles.forEach(role => uniqueRoles.add(role));
          }
        });
        
        setSkills(Array.from(uniqueSkills));
        setRoles(Array.from(uniqueRoles));
        
        // Set bookmarked candidates if user is logged in
        if (recruiterProfile && recruiterProfile.bookmarkedCandidates) {
          setBookmarkedCandidates(recruiterProfile.bookmarkedCandidates);
        }
      } catch (error) {
        console.error('Error fetching filters:', error);
      }
    }
    
    fetchFilters();
  }, [recruiterProfile]);

  const handleSearch = async () => {
    setLoading(true);
    
    try {
      const candidatesQuery = query(
        collection(db, 'users'),
        where('role', '==', UserRole.CANDIDATE)
      );
      
      const snapshot = await getDocs(candidatesQuery);
      
      // Client-side filtering for skills and roles
      let filteredCandidates = snapshot.docs.map(doc => doc.data() as CandidateProfile);
      
      // Filter by selected skills
      if (selectedSkills.length > 0) {
        filteredCandidates = filteredCandidates.filter(candidate => {
          if (!candidate.resumeAnalysis?.skills) return false;
          return selectedSkills.some(skill => 
            candidate.resumeAnalysis!.skills.includes(skill)
          );
        });
      }
      
      // Filter by selected roles
      if (selectedRoles.length > 0) {
        filteredCandidates = filteredCandidates.filter(candidate => {
          if (!candidate.jobPreferences?.roles) return false;
          return selectedRoles.some(role => 
            candidate.jobPreferences!.roles.includes(role)
          );
        });
      }
      
      setCandidates(filteredCandidates);
    } catch (error) {
      console.error('Error searching candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const toggleRole = (role: string) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const toggleBookmark = async (candidateId: string) => {
    if (!recruiterProfile) return;
    
    try {
      const isBookmarked = bookmarkedCandidates.includes(candidateId);
      let updatedBookmarks: string[] = [];
      
      if (isBookmarked) {
        // Remove from bookmarks
        updatedBookmarks = bookmarkedCandidates.filter(id => id !== candidateId);
      } else {
        // Add to bookmarks
        updatedBookmarks = [...bookmarkedCandidates, candidateId];
      }
      
      // Update state
      setBookmarkedCandidates(updatedBookmarks);
      
      // Update in Firestore
      await updateDoc(doc(db, 'users', recruiterProfile.uid), {
        bookmarkedCandidates: updatedBookmarks,
      });
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  return (
    <div>
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-xl font-bold mb-4">Search Filters</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Skills</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {skills.map((skill, index) => (
              <button
                key={index}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedSkills.includes(skill)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
                onClick={() => toggleSkill(skill)}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Desired Roles</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {roles.map((role, index) => (
              <button
                key={index}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedRoles.includes(role)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
                onClick={() => toggleRole(role)}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
        
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full"
        >
          {loading ? 'Searching...' : 'Search Candidates'}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {candidates.map((candidate, index) => (
          <CandidateCard
            key={index}
            candidate={candidate}
            isBookmarked={bookmarkedCandidates.includes(candidate.uid)}
            onBookmarkToggle={toggleBookmark}
            selectedSkills={selectedSkills}
            selectedRoles={selectedRoles}
            recruiterUid={recruiterProfile?.uid}
          />
        ))}
      </div>
      
      {candidates.length === 0 && !loading && (
        <div className="text-center py-10 text-gray-500">
          No candidates found. Try adjusting your filters.
        </div>
      )}
    </div>
  );
}