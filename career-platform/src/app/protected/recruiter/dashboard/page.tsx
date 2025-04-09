'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { CandidateProfile, UserRole, RecruiterProfile } from '@/types/user';
import Link from 'next/link';

export default function RecruiterDashboard() {
  const { userProfile } = useAuth();
  const recruiterProfile = userProfile as RecruiterProfile | null;
  const [recentCandidates, setRecentCandidates] = useState<CandidateProfile[]>([]);
  const [bookmarkedCandidates, setBookmarkedCandidates] = useState<CandidateProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCandidates: 0,
    bookmarkedCandidates: 0,
  });

  useEffect(() => {
    async function fetchDashboardData() {
      if (!recruiterProfile) return;
      
      try {
        // Fetch recent candidates
        const recentQuery = query(
          collection(db, 'users'),
          where('role', '==', UserRole.CANDIDATE),
          limit(5)
        );
        
        const recentSnapshot = await getDocs(recentQuery);
        setRecentCandidates(recentSnapshot.docs.map(doc => doc.data() as CandidateProfile));
        
        // Fetch total candidate count
        const totalQuery = query(
          collection(db, 'users'),
          where('role', '==', UserRole.CANDIDATE)
        );
        
        const totalSnapshot = await getDocs(totalQuery);
        
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
          totalCandidates: totalSnapshot.size,
          bookmarkedCandidates: recruiterProfile.bookmarkedCandidates?.length || 0,
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
      <h1 className="text-3xl font-bold mb-8">Recruiter Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-lg text-gray-500 mb-2">Total Candidates</h2>
          <p className="text-3xl font-bold">{stats.totalCandidates}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-lg text-gray-500 mb-2">Bookmarked Candidates</h2>
          <p className="text-3xl font-bold">{stats.bookmarkedCandidates}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-lg text-gray-500 mb-2">Search Activity</h2>
          <p className="text-3xl font-bold">
            {/* This would be populated from actual search activity */}
            12
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Recent Candidates</h2>
            <Link 
              href="/recruiter/search"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              View All
            </Link>
          </div>
          
          {recentCandidates.length > 0 ? (
            <div className="space-y-4">
              {recentCandidates.map((candidate, index) => (
                <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                  <h3 className="font-semibold">{candidate.displayName}</h3>
                  
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
            <p className="text-gray-500 italic">No candidates found.</p>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Bookmarked Candidates</h2>
            <Link 
              href="/recruiter/bookmarks"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              View All
            </Link>
          </div>
          
          {bookmarkedCandidates.length > 0 ? (
            <div className="space-y-4">
              {bookmarkedCandidates.map((candidate, index) => (
                <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                  <h3 className="font-semibold">{candidate.displayName}</h3>
                  
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
    </div>
  );
}