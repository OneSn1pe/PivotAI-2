'use client';

import React, { useEffect, useState } from 'react';
import { getDocs, collection, query, where, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, storage } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { CareerRoadmap, CandidateProfile } from '@/types/user';
import { useRouter } from 'next/navigation';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { useFileDownload } from '@/hooks/useFileDownload';
import ResumeManager from '@/components/candidate/ResumeManager';

export default function CandidateDashboard() {
  const { userProfile } = useAuth();
  const candidateProfile = userProfile as CandidateProfile | null;
  const router = useRouter();
  const { downloadAndSaveFile, downloading } = useFileDownload();
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [showResumeManager, setShowResumeManager] = useState(false);
  const [validatedResumeUrl, setValidatedResumeUrl] = useState<string | null>(null);
  const [validatingUrl, setValidatingUrl] = useState(false);
  const [displayFileName, setDisplayFileName] = useState<string | null>(candidateProfile?.resumeFileName || null);

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

  useEffect(() => {
    // Validate resume URL when candidate profile changes
    if (candidateProfile?.resumeUrl) {
      validateResumeUrl();
    }
  }, [candidateProfile?.resumeUrl]);

  useEffect(() => {
    if (candidateProfile?.resumeFileName) {
      setDisplayFileName(candidateProfile.resumeFileName);
    }
  }, [candidateProfile?.resumeFileName]);

  const handleResumeUpdate = () => {
    // Refresh dashboard data after resume update
    if (candidateProfile) {
      // Clear validated URL cache to force re-fetching
      setValidatedResumeUrl(null);
      
      // Get the latest filename from user document
      const fetchLatestData = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', candidateProfile.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Update local display filename immediately
            if (userData.resumeFileName) {
              setDisplayFileName(userData.resumeFileName);
            }
          }
        } catch (err) {
          console.error('Error fetching latest user data:', err);
        }
      };
      
      fetchLatestData();
      
      // Force revalidation to get the newest file
      setTimeout(() => {
        forceRevalidateResume();
      }, 1000); // Small delay to ensure Firebase consistency
      
      // Re-fetch data or reset state to ensure refreshed data is displayed
      router.refresh();
    }
  };

  // Function to validate resume URL
  const validateResumeUrl = async () => {
    if (!candidateProfile?.resumeUrl) return;
    
    setValidatingUrl(true);
    
    try {
      // Instead of using fetch (which can trigger CORS issues), 
      // we'll directly check if URL pattern matches a Firebase Storage URL
      const isStorageUrl = candidateProfile.resumeUrl.includes('firebasestorage.googleapis.com');
      
      if (isStorageUrl) {
        // For Firebase URLs, we'll trust it's valid since we just got it from Firebase
        setValidatedResumeUrl(candidateProfile.resumeUrl || null);
      } else {
        // For non-Firebase URLs, we can try fetch
        try {
          const response = await fetch(candidateProfile.resumeUrl, { method: 'HEAD' });
          if (response.ok) {
            setValidatedResumeUrl(candidateProfile.resumeUrl || null);
          } else {
            throw new Error('URL not accessible');
          }
        } catch (fetchErr) {
          throw new Error('URL validation failed');
        }
      }
    } catch (err) {
      console.error('Resume URL validation error:', err);
      
      // Try to recover by finding the most recent file
      try {
        if (!candidateProfile.uid) throw new Error('User not authenticated');
        
        const userResumesRef = ref(storage, `resumes/${candidateProfile.uid}`);
        
        // List all files in the user's resume directory
        const filesList = await listAll(userResumesRef);
        
        if (filesList.items.length === 0) {
          throw new Error('No resume files found in storage');
        }
        
        // Sort by name to get the most recent one (since we use timestamps in filenames)
        const sortedItems = [...filesList.items].sort((a, b) => {
          return b.name.localeCompare(a.name);
        });
        
        // Get the download URL of the most recent file
        const latestFileUrl = await getDownloadURL(sortedItems[0]);
        
        // Update the database with the correct URL
        await updateDoc(doc(db, 'users', candidateProfile.uid), {
          resumeUrl: latestFileUrl,
        });
        
        console.log('Updated resume URL in database to match most recent file');
        setValidatedResumeUrl(latestFileUrl);
      } catch (storageErr) {
        console.error('Storage recovery error:', storageErr);
        setValidatedResumeUrl(null);
      }
    } finally {
      setValidatingUrl(false);
    }
  };

  // Function to handle resume viewing/downloading
  const handleViewResume = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    // Force revalidation to ensure we're using the latest resume URL
    await forceRevalidateResume();
    
    if (validatingUrl) {
      console.log('Please wait, validating resume access...');
      return;
    }
    
    if (!validatedResumeUrl) {
      // Try to validate again
      console.error('Cannot access resume file. Trying to locate it...');
      return;
    }
    
    try {
      // Extract file path from the validatedResumeUrl
      if (!candidateProfile?.uid) {
        throw new Error('User not authenticated');
      }
      
      // Determine path and filename based on available information
      let resumePath = '';
      let filename = 'resume';
      
      // Check if we have a stored filename first
      if (candidateProfile.resumeFileName) {
        filename = candidateProfile.resumeFileName;
      }
      
      // Find the most recent file directly from storage
      const userResumesRef = ref(storage, `resumes/${candidateProfile.uid}`);
      const filesList = await listAll(userResumesRef);
      
      if (filesList.items.length === 0) {
        throw new Error('No resume files found in storage');
      }
      
      // Sort by name to get the most recent one (timestamps in names)
      const sortedItems = [...filesList.items].sort((a, b) => {
        return b.name.localeCompare(a.name);
      });
      
      resumePath = sortedItems[0].fullPath;
      
      // Use the file download hook with the most recent file's path
      await downloadAndSaveFile(resumePath, filename);
      
    } catch (err) {
      console.error('Resume download error:', err);
      
      // Fallback: open in a new tab if all else fails
      window.open(validatedResumeUrl, '_blank');
    }
  };

  // Force revalidation of resume reference to get the latest file
  const forceRevalidateResume = async () => {
    if (!candidateProfile?.uid) return;
    
    setValidatingUrl(true);
    
    try {
      // Get the user's resume directory
      const userResumesRef = ref(storage, `resumes/${candidateProfile.uid}`);
      
      // List all files in the user's resume directory
      const filesList = await listAll(userResumesRef);
      
      if (filesList.items.length === 0) {
        throw new Error('No resume files found in storage');
      }
      
      // Sort by name to get the most recent one (since we use timestamps in filenames)
      const sortedItems = [...filesList.items].sort((a, b) => {
        return b.name.localeCompare(a.name);
      });
      
      // Get the download URL of the most recent file
      const latestFileUrl = await getDownloadURL(sortedItems[0]);
      
      // Update the database with the correct URL if needed
      if (candidateProfile.resumeUrl !== latestFileUrl) {
        await updateDoc(doc(db, 'users', candidateProfile.uid), {
          resumeUrl: latestFileUrl,
        });
        
        console.log('Updated resume URL in database to match most recent file');
      }
      
      setValidatedResumeUrl(latestFileUrl);
    } catch (err) {
      console.error('Force revalidation error:', err);
      setValidatedResumeUrl(null);
    } finally {
      setValidatingUrl(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Candidate Dashboard</h1>
      </div>
      
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
            candidateProfile.resumeAnalysis.skills.length > 0 ? (
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
              <div className="py-3">
                <p className="text-gray-600">
                  No specific skills were found in your resume. For best results, your resume should include a dedicated "Skills" section that explicitly lists technical skills, tools, programming languages, and other relevant competencies.
                </p>
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700">Resume Tip:</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Add a clear "Skills" section to your resume with a bulleted list of specific skills like: Python, React, Docker, SQL, Project Management, etc.
                  </p>
                </div>
                <button
                  onClick={() => setShowResumeManager(true)}
                  className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Update Resume
                </button>
              </div>
            )
          ) : (
            <p className="text-gray-500 italic">Upload your resume to analyze your skills</p>
          )}
        </div>

        {/* Resume Management */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Your Resume</h2>
            <button
              onClick={() => setShowResumeManager(!showResumeManager)}
              className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
            >
              {showResumeManager ? 'Hide' : 'Manage Resume'}
            </button>
          </div>
          
          {showResumeManager ? (
            <ResumeManager onUpdateComplete={handleResumeUpdate} />
          ) : (
            <div>
              {candidateProfile?.resumeUrl ? (
                <div>
                  <div className="flex items-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-green-600 font-semibold">Resume uploaded</span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4">
                    {displayFileName && (
                      <span className="block mb-1">File: <span className="font-medium">{displayFileName}</span></span>
                    )}
                    Update your resume to get a fresh analysis of your skills and areas for improvement.
                  </p>
                  
                  <div className="flex space-x-3">
                    <a 
                      href="#"
                      onClick={handleViewResume}
                      className={`text-blue-600 hover:text-blue-800 text-sm underline ${validatingUrl || downloading ? 'opacity-50 cursor-wait' : ''}`}
                      aria-disabled={validatingUrl || downloading}
                    >
                      {validatingUrl ? 'Validating...' : 
                       downloading ? 'Downloading...' : 'Download Resume'}
                    </a>
                    <button
                      onClick={() => setShowResumeManager(true)}
                      className="text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                      Update Resume
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-4">
                    No resume uploaded yet.
                  </p>
                  <button
                    onClick={() => setShowResumeManager(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                  >
                    Upload Resume
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Add a discreet debug link at the bottom */}
          <div className="mt-4 pt-3 border-t border-gray-100 text-right">
            <a 
              href="/protected/debug/resume-urls" 
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Having trouble viewing your resume?
            </a>
          </div>
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
                        {milestone.skills && milestone.skills.map((skill, skillIndex) => (
                          <span key={skillIndex} className="bg-gray-200 px-2 py-1 rounded text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-sm text-gray-500">{milestone.timeframe}</span>
                        
                        {!milestone.completed && (
                          <button 
                            onClick={() => router.push('/protected/candidate/roadmap')}
                            className="text-blue-600 text-sm hover:underline"
                          >
                            Mark as Complete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 text-center">
                <button
                  onClick={() => router.push('/protected/candidate/roadmap')}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                >
                  View Full Roadmap
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                No career roadmap available yet. Complete your profile to generate one.
              </p>
              <button
                onClick={() => router.push('/protected/candidate/roadmap')}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
              >
                Generate Career Roadmap
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}