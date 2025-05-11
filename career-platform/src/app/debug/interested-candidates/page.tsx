'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { CandidateProfile, UserRole, RecruiterProfile } from '@/types/user';

export default function InterestedCandidatesDebugPage() {
  const { userProfile } = useAuth();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [allCandidates, setAllCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]}: ${message}`]);
  };
  
  useEffect(() => {
    async function fetchCandidates() {
      if (!userProfile) {
        addLog('No user profile found');
        setLoading(false);
        return;
      }
      
      if (userProfile.role !== UserRole.RECRUITER) {
        addLog(`User is not a recruiter (role: ${userProfile.role})`);
        setLoading(false);
        return;
      }
      
      const recruiterProfile = userProfile as RecruiterProfile;
      addLog(`Recruiter company: ${recruiterProfile.company}`);
      
      try {
        // Get all candidates
        addLog('Fetching all candidates...');
        const candidatesQuery = query(
          collection(db, 'users'),
          where('role', '==', UserRole.CANDIDATE)
        );
        
        const snapshot = await getDocs(candidatesQuery);
        addLog(`Found ${snapshot.size} total candidates`);
        
        const allCandidateData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAllCandidates(allCandidateData);
        
        // Filter candidates who have the recruiter's company in their target companies
        addLog('Filtering candidates with matching target companies...');
        const interestedCandidates = snapshot.docs
          .map(doc => {
            const data = doc.data();
            addLog(`Candidate ${data.displayName || 'Unknown'} (${doc.id})`);
            
            if (!data.targetCompanies) {
              addLog(`- No target companies`);
              return null;
            }
            
            addLog(`- Has ${data.targetCompanies.length} target companies`);
            
            // Debug each target company
            data.targetCompanies.forEach((tc: any, i: number) => {
              if (typeof tc === 'string') {
                addLog(`  - [${i}] String: "${tc}"`);
              } else if (tc && typeof tc === 'object') {
                addLog(`  - [${i}] Object: name="${tc.name}", position="${tc.position || ''}"`);
              } else {
                addLog(`  - [${i}] Unknown format: ${JSON.stringify(tc)}`);
              }
            });
            
            // Check if any target companies match
            const isInterested = data.targetCompanies.some((tc: any) => {
              let match = false;
              
              if (typeof tc === 'string') {
                match = tc.toLowerCase() === recruiterProfile.company.toLowerCase();
                addLog(`  - String match "${tc}" with "${recruiterProfile.company}": ${match}`);
              } else if (tc && typeof tc === 'object' && tc.name) {
                match = tc.name.toLowerCase() === recruiterProfile.company.toLowerCase();
                addLog(`  - Object match "${tc.name}" with "${recruiterProfile.company}": ${match}`);
              }
              
              return match;
            });
            
            addLog(`- Interested in recruiter's company: ${isInterested}`);
            
            if (isInterested) {
              return {
                id: doc.id,
                ...data
              };
            }
            
            return null;
          })
          .filter(Boolean);
        
        addLog(`Found ${interestedCandidates.length} interested candidates`);
        setCandidates(interestedCandidates);
      } catch (err: any) {
        const errorMessage = err.message || 'An unknown error occurred';
        addLog(`ERROR: ${errorMessage}`);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCandidates();
  }, [userProfile]);
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Interested Candidates Debug</h1>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="font-bold mb-2">User Information</h2>
        {userProfile ? (
          <div>
            <p><span className="font-semibold">UID:</span> {userProfile.uid}</p>
            <p><span className="font-semibold">Email:</span> {userProfile.email}</p>
            <p><span className="font-semibold">Name:</span> {userProfile.displayName}</p>
            <p><span className="font-semibold">Role:</span> {userProfile.role}</p>
            {userProfile.role === UserRole.RECRUITER && (
              <p><span className="font-semibold">Company:</span> {(userProfile as RecruiterProfile).company}</p>
            )}
          </div>
        ) : (
          <p className="text-red-500">Not logged in</p>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="bg-yellow-50 p-4 rounded-lg mb-6">
            <h2 className="font-bold mb-2">Debug Logs</h2>
            <div className="bg-yellow-100 p-3 rounded-lg max-h-60 overflow-y-auto font-mono text-sm">
              {logs.map((log, index) => (
                <div key={index} className={`
                  ${log.includes('ERROR:') ? 'text-red-600' : ''}
                  ${log.includes('Found') ? 'font-bold' : ''}
                `}>
                  {log}
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <h2 className="font-bold mb-4">Interested Candidates ({candidates.length})</h2>
              {error && (
                <div className="bg-red-50 p-3 rounded-lg mb-4 text-red-700">
                  {error}
                </div>
              )}
              
              {candidates.length > 0 ? (
                <div className="space-y-4">
                  {candidates.map((candidate, index) => (
                    <div key={index} className="border-b pb-4">
                      <h3 className="font-semibold">{candidate.displayName || 'Unknown'}</h3>
                      <p className="text-sm text-gray-600">ID: {candidate.id}</p>
                      <p className="text-sm text-gray-600">Email: {candidate.email}</p>
                      
                      <div className="mt-2">
                        <h4 className="text-sm font-medium">Target Companies:</h4>
                        <ul className="list-disc pl-5 text-sm">
                          {candidate.targetCompanies && candidate.targetCompanies.map((tc: any, i: number) => (
                            <li key={i} className={`${
                              (typeof tc === 'string' && tc.toLowerCase() === (userProfile as RecruiterProfile).company.toLowerCase()) ||
                              (typeof tc === 'object' && tc.name && tc.name.toLowerCase() === (userProfile as RecruiterProfile).company.toLowerCase())
                                ? 'text-green-600 font-bold'
                                : ''
                            }`}>
                              {typeof tc === 'string' 
                                ? tc 
                                : `${tc.name}${tc.position ? ` (${tc.position})` : ''}`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No interested candidates found</p>
              )}
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <h2 className="font-bold mb-4">All Candidates ({allCandidates.length})</h2>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {allCandidates.map((candidate, index) => (
                  <div key={index} className="border-b pb-4">
                    <h3 className="font-semibold">{candidate.displayName || 'Unknown'}</h3>
                    <p className="text-sm text-gray-600">ID: {candidate.id}</p>
                    
                    <div className="mt-2">
                      <h4 className="text-sm font-medium">Target Companies:</h4>
                      {candidate.targetCompanies && candidate.targetCompanies.length > 0 ? (
                        <ul className="list-disc pl-5 text-sm">
                          {candidate.targetCompanies.map((tc: any, i: number) => (
                            <li key={i} className={`${
                              (typeof tc === 'string' && tc.toLowerCase() === (userProfile as RecruiterProfile).company.toLowerCase()) ||
                              (typeof tc === 'object' && tc.name && tc.name.toLowerCase() === (userProfile as RecruiterProfile).company.toLowerCase())
                                ? 'text-green-600 font-bold'
                                : ''
                            }`}>
                              {typeof tc === 'string' 
                                ? tc 
                                : `${tc.name || 'Unknown'}${tc.position ? ` (${tc.position})` : ''}`}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No target companies</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 