'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { CandidateProfile, UserRole, RecruiterProfile, TargetCompany } from '@/types/user';
import { useRouter } from 'next/navigation';

export default function InterestedCandidatesPage() {
  const { userProfile } = useAuth();
  const recruiterProfile = userProfile as RecruiterProfile | null;
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchInterestedCandidates() {
      if (!recruiterProfile) return;
      
      try {
        console.log('Fetching interested candidates for company:', recruiterProfile.company);
        
        // Get all candidates
        const candidatesQuery = query(
          collection(db, 'users'),
          where('role', '==', UserRole.CANDIDATE)
        );
        
        console.log('Query for candidates with role:', UserRole.CANDIDATE);
        const snapshot = await getDocs(candidatesQuery);
        console.log(`Found ${snapshot.size} total candidates`);
        
        // Filter candidates who have the recruiter's company in their target companies
        const interestedCandidates = snapshot.docs
          .map(doc => {
            const data = doc.data() as CandidateProfile;
            console.log(`Checking candidate ${data.displayName} (${doc.id})`);
            console.log('Target companies:', data.targetCompanies);
            return data;
          })
          .filter(candidate => {
            if (!candidate.targetCompanies) {
              console.log(`Candidate ${candidate.displayName} has no target companies`);
              return false;
            }
            
            // Check if the candidate has the recruiter's company as a target
            const isInterestedInCompany = candidate.targetCompanies?.some((company: any) => {
              if (!recruiterProfile?.company) return false;
              
              return typeof company === 'string' 
                ? company.toLowerCase() === recruiterProfile.company.toLowerCase() 
                : company?.name && company.name.toLowerCase() === recruiterProfile.company.toLowerCase();
            });
            
            return isInterestedInCompany;
          });
        
        console.log(`Found ${interestedCandidates.length} interested candidates`);
        setCandidates(interestedCandidates);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching interested candidates:', error);
        setLoading(false);
      }
    }
    
    fetchInterestedCandidates();
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
        <h1 className="text-3xl font-bold">Candidates Interested in {recruiterProfile?.company}</h1>
        <button
          onClick={() => router.back()}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
        >
          Back
        </button>
      </div>

      {candidates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.map((candidate, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="font-semibold text-xl mb-4">{candidate.displayName}</h3>
              
              {/* Show position if available */}
              {candidate.targetCompanies?.find((company: any) => {
                if (!recruiterProfile?.company) return false;
                
                return typeof company === 'object' && company?.name && 
                  company.name.toLowerCase() === recruiterProfile.company.toLowerCase();
              }) && (
                <div className="mb-4 bg-blue-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Interested in Position</h4>
                  <p className="font-semibold">
                    {(() => {
                      const matchedCompany = candidate.targetCompanies?.find((company: any) => {
                        if (!recruiterProfile?.company) return false;
                        return typeof company === 'object' && company?.name && 
                          company.name.toLowerCase() === recruiterProfile.company.toLowerCase();
                      });
                      
                      return matchedCompany && typeof matchedCompany === 'object' && matchedCompany.position 
                        ? matchedCompany.position 
                        : 'Not specified';
                    })()}
                  </p>
                </div>
              )}
              
              {candidate.resumeAnalysis?.skills && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {candidate.resumeAnalysis.skills.map((skill, skillIndex) => (
                      <span 
                        key={skillIndex}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {candidate.jobPreferences && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Preferences</h4>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Work Type:</span>{' '}
                      <span className="capitalize">{candidate.jobPreferences.remotePreference}</span>
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Expected Salary:</span>{' '}
                      ${candidate.jobPreferences.salaryExpectation.toLocaleString()}/year
                    </p>
                  </div>
                </div>
              )}

              <button 
                onClick={() => router.push(`/protected/recruiter/candidate/${candidate.uid}`)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md"
              >
                View Full Profile
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No candidates interested in {recruiterProfile?.company} yet.</p>
        </div>
      )}
    </div>
  );
} 