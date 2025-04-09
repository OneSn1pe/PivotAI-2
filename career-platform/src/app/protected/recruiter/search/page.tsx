'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { CandidateProfile } from '@/types/user';

export default function RecruiterSearchPage() {
  const { userProfile } = useAuth();
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    skills: [] as string[],
    experience: '' as string,
    location: '' as string,
  });

  useEffect(() => {
    const fetchCandidates = async () => {
      if (!userProfile) return;
      
      try {
        setLoading(true);
        const candidatesRef = collection(db, 'users');
        const q = query(candidatesRef, where('role', '==', 'Candidate'));
        const querySnapshot = await getDocs(q);
        
        const candidatesData = querySnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        })) as CandidateProfile[];
        
        setCandidates(candidatesData);
      } catch (err) {
        console.error('Error fetching candidates:', err);
        setError('Failed to load candidates. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [userProfile]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search logic here
  };

  const filteredCandidates = candidates.filter(candidate => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      candidate.displayName?.toLowerCase().includes(searchLower) ||
      candidate.skills?.some(skill => skill.toLowerCase().includes(searchLower)) ||
      candidate.resumeAnalysis?.experience.some(exp => exp.toLowerCase().includes(searchLower))
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 p-4 rounded-lg max-w-md">
          <h2 className="text-red-600 font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Search Candidates</h1>
      
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search by name, skills, or experience..."
            className="flex-grow p-2 border rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Search
          </button>
        </div>
      </form>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCandidates.map((candidate) => (
          <div key={candidate.uid} className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-2">{candidate.displayName}</h2>
            <p className="text-gray-600 mb-4">{candidate.email}</p>
            
            {candidate.skills && candidate.skills.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {candidate.resumeAnalysis?.experience && candidate.resumeAnalysis.experience.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Experience</h3>
                <ul className="list-disc pl-5">
                  {candidate.resumeAnalysis.experience.slice(0, 3).map((exp, index) => (
                    <li key={index} className="text-sm">
                      {exp}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full">
              View Profile
            </button>
          </div>
        ))}
      </div>
      
      {filteredCandidates.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No candidates found matching your search criteria.</p>
        </div>
      )}
    </div>
  );
}
