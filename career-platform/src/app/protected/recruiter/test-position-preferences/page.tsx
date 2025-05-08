'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { RecruiterProfile, PositionPreferences } from '@/types/user';
import PositionPreferencesUpload from '@/components/recruiter/PositionPreferencesUpload';
import { doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';

export default function TestPositionPreferencesPage() {
  const { userProfile } = useAuth();
  const recruiterProfile = userProfile as RecruiterProfile | null;
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [positionPreferences, setPositionPreferences] = useState<Record<string, PositionPreferences>>({});
  const [interestedCandidates, setInterestedCandidates] = useState<any[]>([]);
  const [showTest, setShowTest] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  
  useEffect(() => {
    if (!userProfile) return;
    
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch position preferences
        if (recruiterProfile?.positionPreferences) {
          setPositionPreferences(recruiterProfile.positionPreferences);
        }
        
        // Fetch candidates interested in this recruiter's company
        if (recruiterProfile?.company) {
          const candidatesQuery = query(
            collection(db, 'users'),
            where('role', '==', 'candidate')
          );
          
          const snapshot = await getDocs(candidatesQuery);
          
          // Filter candidates who have the recruiter's company in their target companies
          const interested = snapshot.docs
            .map((doc: any) => doc.data())
            .filter((candidate: any) => {
              if (!candidate.targetCompanies) return false;
              
              // Check if any of the target companies match the recruiter's company
              return candidate.targetCompanies.some((targetCompany: any) => {
                // Handle both old format (string) and new format (object)
                if (typeof targetCompany === 'string') {
                  return targetCompany === recruiterProfile.company;
                } else {
                  return targetCompany.name === recruiterProfile.company;
                }
              });
            });
          
          setInterestedCandidates(interested);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [userProfile, recruiterProfile]);
  
  const handleUpdateComplete = () => {
    // Refresh user profile to get updated position preferences
    window.location.reload();
  };
  
  const runTest = async () => {
    setShowTest(true);
    setTestResults([]);
    
    if (!recruiterProfile || !recruiterProfile.company) {
      setTestResults(['Error: Recruiter profile not loaded or company not set']);
      return;
    }
    
    if (Object.keys(positionPreferences).length === 0) {
      setTestResults(['Error: No position preferences set. Please add at least one position first.']);
      return;
    }
    
    if (interestedCandidates.length === 0) {
      setTestResults(['Error: No candidates interested in your company. Test cannot proceed.']);
      return;
    }
    
    // Log the test steps
    const results = [`Starting test with ${interestedCandidates.length} candidate(s) and ${Object.keys(positionPreferences).length} position preference(s)`];
    
    // Test process:
    // 1. Select a candidate interested in your company
    const candidate = interestedCandidates[0];
    results.push(`Selected candidate: ${candidate.displayName}`);
    
    // 2. Check if the candidate has a resume analysis
    if (!candidate.resumeAnalysis) {
      results.push('Candidate does not have a resume analysis. Test cannot proceed.');
      setTestResults(results);
      return;
    }
    
    results.push(`Candidate has resume analysis with ${candidate.resumeAnalysis.skills?.length || 0} skills`);
    
    // 3. Get the candidate's target position at your company
    let targetPosition = '';
    candidate.targetCompanies.forEach((target: any) => {
      if (typeof target === 'object' && target.name === recruiterProfile.company) {
        targetPosition = target.position;
      }
    });
    
    if (!targetPosition) {
      results.push('Candidate is interested in your company but has not specified a position.');
    } else {
      results.push(`Candidate is interested in the position: ${targetPosition}`);
    }
    
    // 4. Check if there's a matching position preference
    let matchingPreference: PositionPreferences | null = null;
    
    // Try exact match first
    if (targetPosition && positionPreferences[targetPosition]) {
      matchingPreference = positionPreferences[targetPosition];
      results.push(`Found exact position preference match for "${targetPosition}"`);
    } else {
      // Try partial match
      for (const [prefTitle, prefs] of Object.entries(positionPreferences)) {
        if (targetPosition && 
            (prefTitle.toLowerCase().includes(targetPosition.toLowerCase()) ||
             targetPosition.toLowerCase().includes(prefTitle.toLowerCase()))) {
          matchingPreference = prefs;
          results.push(`Found partial position preference match: "${prefTitle}" for target "${targetPosition}"`);
          break;
        }
      }
      
      // If still no match, use the first one
      if (!matchingPreference && Object.keys(positionPreferences).length > 0) {
        const firstKey = Object.keys(positionPreferences)[0];
        matchingPreference = positionPreferences[firstKey];
        results.push(`No matching preference found. Using default: "${firstKey}"`);
      }
    }
    
    if (matchingPreference) {
      results.push('');
      results.push('POSITION PREFERENCE DETAILS:');
      results.push(`Title: ${matchingPreference.title}`);
      results.push(`Description: ${matchingPreference.description.substring(0, 100)}...`);
      results.push(`Required Skills: ${matchingPreference.requiredSkills.join(', ')}`);
      
      // 5. Check skill overlap between candidate and position preferences
      const candidateSkills = candidate.resumeAnalysis.skills || [];
      const requiredSkills = matchingPreference.requiredSkills || [];
      const preferredSkills = matchingPreference.preferredSkills || [];
      
      const requiredOverlap = candidateSkills.filter((skill: string) => 
        requiredSkills.some((req: string) => req.toLowerCase().includes(skill.toLowerCase()) || 
                              skill.toLowerCase().includes(req.toLowerCase()))
      );
      
      const preferredOverlap = candidateSkills.filter((skill: string) => 
        preferredSkills.some((pref: string) => pref.toLowerCase().includes(skill.toLowerCase()) || 
                               skill.toLowerCase().includes(pref.toLowerCase()))
      );
      
      results.push('');
      results.push('SKILL ANALYSIS:');
      results.push(`Candidate has ${candidateSkills.length} skills`);
      results.push(`Position requires ${requiredSkills.length} skills`);
      results.push(`Position prefers ${preferredSkills.length} skills`);
      results.push(`Candidate has ${requiredOverlap.length}/${requiredSkills.length} required skills`);
      results.push(`Candidate has ${preferredOverlap.length}/${preferredSkills.length} preferred skills`);
      
      if (requiredOverlap.length < requiredSkills.length) {
        results.push('');
        results.push('SKILL GAPS - Candidate needs to develop:');
        requiredSkills.forEach((skill: string) => {
          if (!requiredOverlap.some((s: string) => s.toLowerCase().includes(skill.toLowerCase()) || 
                                      skill.toLowerCase().includes(s.toLowerCase()))) {
            results.push(`- ${skill}`);
          }
        });
      }
      
      // 6. Check if the candidate has a roadmap
      try {
        const roadmapQuery = query(
          collection(db, 'roadmaps'),
          where('candidateId', '==', candidate.uid)
        );
        
        const roadmapSnapshot = await getDocs(roadmapQuery);
        
        if (!roadmapSnapshot.empty) {
          const roadmap = roadmapSnapshot.docs[0].data();
          
          results.push('');
          results.push('ROADMAP ANALYSIS:');
          results.push(`Candidate has a roadmap with ${roadmap.milestones?.length || 0} milestones`);
          
          // Check if roadmap milestones include required skills
          const roadmapSkills = roadmap.milestones?.flatMap((m: any) => m.skills || []) || [];
          const roadmapRequiredOverlap = roadmapSkills.filter((skill: string) => 
            requiredSkills.some((req: string) => req.toLowerCase().includes(skill.toLowerCase()) || 
                                  skill.toLowerCase().includes(req.toLowerCase()))
          );
          
          results.push(`Roadmap covers ${roadmapRequiredOverlap.length}/${requiredSkills.length} required skills`);
          
          if (roadmapRequiredOverlap.length > 0) {
            results.push('');
            results.push('ROADMAP ALIGNMENT WITH POSITION:');
            results.push(`The roadmap is ${Math.round((roadmapRequiredOverlap.length / requiredSkills.length) * 100)}% aligned with position requirements`);
            
            if (roadmapRequiredOverlap.length / requiredSkills.length >= 0.7) {
              results.push('✅ The roadmap is well-aligned with the position requirements');
            } else if (roadmapRequiredOverlap.length / requiredSkills.length >= 0.4) {
              results.push('⚠️ The roadmap is partially aligned with the position requirements');
            } else {
              results.push('❌ The roadmap is poorly aligned with the position requirements');
            }
          }
        } else {
          results.push('');
          results.push('Candidate does not have a roadmap yet');
        }
      } catch (error) {
        console.error('Error checking roadmap:', error);
        results.push('Error checking roadmap data');
      }
    } else {
      results.push('No position preferences found that could be applied');
    }
    
    // Set final results
    setTestResults(results);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Position Preferences Testing</h1>
        <button
          onClick={() => router.push('/protected/recruiter/dashboard')}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
        >
          Back to Dashboard
        </button>
      </div>
      
      <div className="mb-8 bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h2 className="text-xl font-bold mb-2">Test Environment</h2>
        <p className="text-gray-700 mb-4">
          This page allows you to test how your position preferences influence roadmap generation for candidates.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-lg mb-2">Your Company</h3>
            <p className="text-blue-800 font-semibold">{recruiterProfile?.company || 'Not set'}</p>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-2">Position Preferences</h3>
            <p className="text-blue-800 font-semibold">
              {Object.keys(positionPreferences).length || 0} position(s) defined
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-2">Interested Candidates</h3>
            <p className="text-blue-800 font-semibold">{interestedCandidates.length || 0} candidate(s)</p>
          </div>
          
          <div className="text-right md:text-left">
            <button
              onClick={runTest}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              disabled={loading || Object.keys(positionPreferences).length === 0 || interestedCandidates.length === 0}
            >
              Run Integration Test
            </button>
          </div>
        </div>
      </div>
      
      {showTest && testResults.length > 0 && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Test Results</h2>
          <div className="bg-gray-100 p-4 rounded font-mono text-sm whitespace-pre-wrap">
            {testResults.map((line, index) => (
              <div key={index} className={`${line.startsWith('❌') ? 'text-red-500' : line.startsWith('⚠️') ? 'text-yellow-600' : line.startsWith('✅') ? 'text-green-600' : 'text-gray-800'} ${line === '' ? 'h-4' : ''}`}>
                {line}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-xl font-bold">Current Position Preferences</h2>
        </div>
        
        <div className="p-6">
          {Object.keys(positionPreferences).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(positionPreferences).map(([title, prefs]) => (
                <div key={title} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">{title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{prefs.description}</p>
                  
                  <div className="mb-2">
                    <h4 className="text-xs font-medium text-gray-500 uppercase">Required Skills</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {prefs.requiredSkills.map((skill, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {prefs.preferredSkills && prefs.preferredSkills.length > 0 && (
                    <div className="mb-2">
                      <h4 className="text-xs font-medium text-gray-500 uppercase">Preferred Skills</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {prefs.preferredSkills.map((skill, index) => (
                          <span key={index} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No position preferences have been added yet.</p>
          )}
        </div>
      </div>
      
      <PositionPreferencesUpload onUpdateComplete={handleUpdateComplete} />
    </div>
  );
} 