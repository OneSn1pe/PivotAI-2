'use client';

import React, { useEffect, useState } from 'react';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { CareerRoadmap, CandidateProfile } from '@/types/user';
import { useRouter } from 'next/navigation';

export default function CandidateDashboard() {
  const { userProfile } = useAuth();
  const candidateProfile = userProfile as CandidateProfile | null;
  const router = useRouter();
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRoadmap() {
      if (!candidateProfile) return;
      
      try {
        const roadmapQuery = query(
          collection(db, 'roadmaps'),
          where('candidateId', '==', candidateProfile.uid)
        );
        
        const roadmapSnapshot = await getDocs(roadmapQuery);
        
        if (!roadmapSnapshot.empty) {
          const roadmapData = roadmapSnapshot.docs[0].data() as CareerRoadmap;
          setRoadmap(roadmapData);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching roadmap:', error);
        setLoading(false);
      }
    }
    
    fetchRoadmap();
  }, [candidateProfile]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Your Career Dashboard</h1>
      
      {!candidateProfile?.resumeUrl && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
          <p className="text-yellow-700">
            Complete your profile by uploading your resume to get personalized career recommendations.
          </p>
          <button
            onClick={() => router.push('/protected/candidate/profile')}
            className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-4 rounded"
          >
            Upload Resume
          </button>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Progress Summary */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Your Progress</h2>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Profile Completion</span>
                <span className="text-blue-600 font-semibold">
                  {candidateProfile?.resumeUrl ? '80%' : '20%'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: candidateProfile?.resumeUrl ? '80%' : '20%' }}
                ></div>
              </div>
            </div>
            
            {roadmap && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">Roadmap Progress</span>
                  <span className="text-green-600 font-semibold">
                    {Math.round((roadmap.milestones.filter(m => m.completed).length / roadmap.milestones.length) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${Math.round((roadmap.milestones.filter(m => m.completed).length / roadmap.milestones.length) * 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Skills */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Your Skills</h2>
          
          {candidateProfile?.resumeAnalysis?.skills ? (
            <div className="flex flex-wrap gap-2">
              {candidateProfile.resumeAnalysis.skills.map((skill, index) => (
                <span 
                  key={index}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">Upload your resume to analyze your skills</p>
          )}
        </div>

        {/* Job Preferences */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Your Job Preferences</h2>
          
          {candidateProfile?.jobPreferences ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Desired Roles</h3>
                <div className="flex flex-wrap gap-2">
                  {candidateProfile.jobPreferences.roles.map((role, index) => (
                    <span 
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Preferred Locations</h3>
                <div className="flex flex-wrap gap-2">
                  {candidateProfile.jobPreferences.locations.map((location, index) => (
                    <span 
                      key={index}
                      className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                    >
                      {location}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Work Preference</h3>
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm capitalize">
                  {candidateProfile.jobPreferences.remotePreference}
                </span>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Salary Expectation</h3>
                <span className="text-gray-800">
                  ${candidateProfile.jobPreferences.salaryExpectation.toLocaleString()} / year
                </span>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Target Industries</h3>
                <div className="flex flex-wrap gap-2">
                  {candidateProfile.jobPreferences.industries.map((industry, index) => (
                    <span 
                      key={index}
                      className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm"
                    >
                      {industry}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-4">
                No job preferences set yet.
              </p>
              <button
                onClick={() => router.push('/protected/candidate/preferences')}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
              >
                Set Job Preferences
              </button>
            </div>
          )}
        </div>
        
        {/* Career Roadmap */}
        <div className="bg-white p-6 rounded-lg shadow-lg md:col-span-2">
          <h2 className="text-xl font-bold mb-4">Your Career Roadmap</h2>
          
          {roadmap ? (
            <div className="relative">
              <div className="absolute top-0 bottom-0 left-4 w-1 bg-blue-200"></div>
              
              <div className="space-y-6">
                {roadmap.milestones.map((milestone, index) => (
                  <div key={index} className="relative pl-10">
                    <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      milestone.completed ? 'bg-green-500' : 'bg-blue-500'
                    }`}>
                      {milestone.completed ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <span className="text-white font-bold">{index + 1}</span>
                      )}
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="font-bold text-lg">{milestone.title}</h3>
                      <p className="text-gray-600 mb-2">{milestone.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        {milestone.skills.map((skill, skillIndex) => (
                          <span key={skillIndex} className="bg-gray-200 px-2 py-1 rounded text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-sm text-gray-500">{milestone.timeframe}</span>
                        
                        {!milestone.completed && (
                          <button className="text-blue-600 text-sm hover:underline">
                            Mark as Complete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                No career roadmap available yet. Complete your profile and job preferences to generate one.
              </p>
              <button
                onClick={() => router.push('/protected/candidate/preferences')}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
              >
                Set Job Preferences
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}