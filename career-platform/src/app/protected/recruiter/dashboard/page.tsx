'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { CandidateProfile, UserRole, RecruiterProfile } from '@/types/user';
import { useRouter } from 'next/navigation';

export default function RecruiterDashboard() {
  const { userProfile } = useAuth();
  const recruiterProfile = userProfile as RecruiterProfile | null;
  const [bookmarkedCandidates, setBookmarkedCandidates] = useState<CandidateProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    bookmarkedCandidates: 0,
    interestedCandidates: 0,
  });
  const router = useRouter();
  
  useEffect(() => {
    async function fetchDashboardData() {
      if (!recruiterProfile) return;
      
      try {
        // Get all candidates
        const candidatesQuery = query(
          collection(db, 'users'),
          where('role', '==', UserRole.CANDIDATE)
        );
        
        const candidatesSnapshot = await getDocs(candidatesQuery);
        
        // Filter candidates who have the recruiter's company in their target companies
        const interestedCandidates = candidatesSnapshot.docs
          .map(doc => doc.data() as CandidateProfile)
          .filter(candidate => {
            if (!candidate.targetCompanies) return false;
            
            // Check if any of the target companies match the recruiter's company
            return candidate.targetCompanies.some(targetCompany => {
              // Handle both old format (string) and new format (object)
              if (typeof targetCompany === 'string') {
                return targetCompany === recruiterProfile.company;
              } else {
                return targetCompany.name === recruiterProfile.company;
              }
            });
          });
        
        // Fetch bookmarked candidates
        if (recruiterProfile.bookmarkedCandidates && recruiterProfile.bookmarkedCandidates.length > 0) {
          const bookmarkedProfiles = [];
          
          for (const candidateId of recruiterProfile.bookmarkedCandidates.slice(0, 5)) {
            const candidateDoc = await getDocs(
              query(collection(db, 'users'), where('uid', '==', candidateId))
            );
            
            if (!candidateDoc.empty) {
              bookmarkedProfiles.push(candidateDoc.docs[0].data() as CandidateProfile);
            }
          }
          
          setBookmarkedCandidates(bookmarkedProfiles);
        }
        
        setStats({
          bookmarkedCandidates: recruiterProfile.bookmarkedCandidates?.length || 0,
          interestedCandidates: interestedCandidates.length,
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    }
    
    fetchDashboardData();
  }, [recruiterProfile]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Recruiter Dashboard</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-lg text-gray-500 mb-2">Bookmarked Candidates</h2>
          <p className="text-3xl font-bold">{stats.bookmarkedCandidates}</p>
        </div>
        
        <button
          onClick={() => router.push('/protected/recruiter/interested')}
          className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
        >
          <h2 className="text-lg text-gray-500 mb-2">Interested in {recruiterProfile?.company}</h2>
          <p className="text-3xl font-bold">{stats.interestedCandidates}</p>
          <p className="text-sm text-blue-600 mt-2">Click to view all →</p>
        </button>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Bookmarked Candidates</h2>
          <button
            onClick={() => router.push('/protected/recruiter/bookmarks')}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            View All
          </button>
        </div>
        
        {bookmarkedCandidates.length > 0 ? (
          <div className="space-y-4">
            {bookmarkedCandidates.map((candidate, index) => (
              <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                <h3 
                  className="font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                  onClick={() => router.push(`/protected/recruiter/candidate/${candidate.uid}`)}
                >
                  {candidate.displayName}
                </h3>
                
                {candidate.resumeAnalysis?.skills && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {candidate.resumeAnalysis.skills.slice(0, 3).map((skill, skillIndex) => (
                      <span 
                        key={skillIndex}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                    {candidate.resumeAnalysis.skills.length > 3 && (
                      <span className="text-gray-500 text-xs">
                        +{candidate.resumeAnalysis.skills.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No bookmarked candidates yet.</p>
        )}
      </div>
    </div>
  );
}