'use client';

import React from 'react';
import Link from 'next/link';
import { CandidateProfile } from '@/types/user';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface CandidateCardProps {
  candidate: CandidateProfile;
  isBookmarked: boolean;
  onBookmarkToggle: (candidateId: string) => void;
  selectedSkills?: string[];
  selectedRoles?: string[];
  recruiterUid?: string;
  compact?: boolean;
}

export default function CandidateCard({
  candidate,
  isBookmarked,
  onBookmarkToggle,
  selectedSkills = [],
  selectedRoles = [],
  recruiterUid,
  compact = false
}: CandidateCardProps) {
  const { refreshToken } = useAuth();
  
  const toggleBookmark = async () => {
    // Call the parent component's handler
    onBookmarkToggle(candidate.uid);
  };
  
  const handleViewProfile = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await refreshToken();
      window.location.href = `/protected/recruiter/candidate/${candidate.uid}`;
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg ${compact ? 'p-4 border border-gray-200' : 'p-6'}`}>
      <div className="flex justify-between items-start">
        <h3 className={`${compact ? 'font-semibold' : 'font-bold text-lg'}`}>{candidate.displayName}</h3>
        <button
          onClick={toggleBookmark}
          className={`${compact ? 'text-red-600 hover:text-red-800 text-sm' : 'text-xl'} ${
            isBookmarked && !compact ? 'text-yellow-500' : compact ? '' : 'text-gray-400'
          }`}
        >
          {compact ? 'Remove' : '★'}
        </button>
      </div>
      
      {candidate.resumeAnalysis?.skills && (
        <div className={`${compact ? 'mt-2' : 'mt-4'}`}>
          {!compact && <h4 className="font-semibold text-sm text-gray-700">Skills</h4>}
          <div className="flex flex-wrap gap-1 mt-1">
            {(compact ? candidate.resumeAnalysis.skills.slice(0, 3) : candidate.resumeAnalysis.skills).map((skill, skillIndex) => (
              <span 
                key={skillIndex} 
                className={`px-2 py-1 rounded-full text-xs ${
                  !compact && selectedSkills.includes(skill)
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {skill}
              </span>
            ))}
            {compact && candidate.resumeAnalysis.skills.length > 3 && (
              <span className="text-gray-500 text-xs">
                +{candidate.resumeAnalysis.skills.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
      
      {!compact && candidate.jobPreferences?.roles && (
        <div className="mt-3">
          <h4 className="font-semibold text-sm text-gray-700">Looking for</h4>
          <div className="flex flex-wrap gap-1 mt-1">
            {candidate.jobPreferences.roles.map((role, roleIndex) => (
              <span 
                key={roleIndex} 
                className={`px-2 py-1 rounded-full text-xs ${
                  selectedRoles.includes(role)
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <Link href={`/protected/recruiter/candidate/${candidate.uid}`} 
            className={`${compact ? 'mt-3' : 'mt-4'} block w-full`}
            onClick={handleViewProfile}>
        <button className={`w-full bg-blue-500 hover:bg-blue-600 text-white rounded text-sm ${compact ? 'py-1 px-3' : 'py-2 px-3'}`}>
          {compact ? 'View Profile' : 'View Full Profile'}
        </button>
      </Link>
    </div>
  );
} 