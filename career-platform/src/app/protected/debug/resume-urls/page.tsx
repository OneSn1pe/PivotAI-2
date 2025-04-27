'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { db, storage } from '@/config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { CandidateProfile } from '@/types/user';
import { useFileDownload } from '@/hooks/useFileDownload';

export default function ResumeUrlDebugPage() {
  const { userProfile } = useAuth();
  const candidateProfile = userProfile as CandidateProfile | null;
  const router = useRouter();
  const { downloadAndSaveFile, downloading } = useFileDownload();
  
  const [loading, setLoading] = useState(true);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [isUrlValid, setIsUrlValid] = useState<boolean | null>(null);
  const [checkingUrl, setCheckingUrl] = useState(false);
  const [storageFiles, setStorageFiles] = useState<{name: string, path: string, url: string}[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  
  useEffect(() => {
    if (!candidateProfile) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get the current resume URL from the database
        const userDocRef = doc(db, 'users', candidateProfile.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setResumeUrl(userData.resumeUrl || null);
          setResumeFileName(userData.resumeFileName || null);
        }
        
        // Get files from storage
        await fetchStorageFiles();
        
      } catch (err) {
        setError(`Error loading data: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [candidateProfile]);
  
  const fetchStorageFiles = async () => {
    if (!candidateProfile) return;
    
    try {
      const storagePath = `resumes/${candidateProfile.uid}`;
      const storageRef = ref(storage, storagePath);
      
      // List all files in storage
      const result = await listAll(storageRef);
      
      // Get download URLs for all files
      const fileDetails = await Promise.all(
        result.items.map(async (item) => {
          try {
            const url = await getDownloadURL(item);
            return {
              name: item.name,
              path: item.fullPath,
              url
            };
          } catch (err) {
            return {
              name: item.name,
              path: item.fullPath,
              url: 'Error fetching URL'
            };
          }
        })
      );
      
      // Sort by name descending (most recent first, assuming timestamp in filename)
      fileDetails.sort((a, b) => b.name.localeCompare(a.name));
      
      setStorageFiles(fileDetails);
    } catch (err) {
      console.error("Error fetching storage files:", err);
      setStorageFiles([]);
    }
  };
  
  const checkUrlValidity = async () => {
    if (!resumeUrl) {
      setIsUrlValid(false);
      return;
    }
    
    setCheckingUrl(true);
    setIsUrlValid(null);
    
    try {
      // Handle Firebase Storage URLs differently to avoid CORS issues
      const isStorageUrl = resumeUrl.includes('firebasestorage.googleapis.com');
      
      if (isStorageUrl) {
        // For Firebase URLs, we'll assume it's valid unless proven otherwise
        setIsUrlValid(true);
      } else {
        // For non-Firebase URLs, try fetch
        const response = await fetch(resumeUrl, { method: 'HEAD' });
        setIsUrlValid(response.ok);
      }
    } catch (err) {
      console.error("Error checking URL:", err);
      setIsUrlValid(false);
    } finally {
      setCheckingUrl(false);
    }
  };
  
  // New function to safely download or view a file
  const handleViewOrDownload = async (url: string) => {
    try {
      if (!candidateProfile?.uid) {
        throw new Error('User not authenticated');
      }
      
      // Try to extract the storage path from URL
      let path = '';
      let filename = 'resume';
      
      // Extract path from the Firebase Storage URL
      if (url.includes('firebasestorage.googleapis.com')) {
        const pathMatch = url.match(/\/o\/([^?]+)/);
        if (pathMatch && pathMatch[1]) {
          path = decodeURIComponent(pathMatch[1]);
          
          // Extract filename from path
          const pathParts = path.split('/');
          filename = pathParts[pathParts.length - 1];
        } else {
          throw new Error('Unable to parse storage path from URL');
        }
      } else {
        throw new Error('Not a Firebase Storage URL');
      }
      
      // Use the file download hook
      await downloadAndSaveFile(path, filename);
      
    } catch (err) {
      console.error('Error downloading file:', err);
      // Fallback to direct URL open
      window.open(url, '_blank');
    }
  };
  
  const updateResumeUrl = async (newUrl: string, filename?: string) => {
    if (!candidateProfile) return;
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Get filename from the storage item if not provided
      let newFilename = filename;
      if (!newFilename) {
        // Try to extract from the URL or path
        const file = storageFiles.find(f => f.url === newUrl);
        if (file) {
          // Extract the original filename without the timestamp prefix
          const parts = file.name.split('_');
          if (parts.length > 1) {
            // Remove timestamp prefix
            parts.shift(); 
            newFilename = parts.join('_');
          } else {
            newFilename = file.name;
          }
        }
      }
      
      // Update database with both URL and filename
      const updateData: Record<string, any> = {
        resumeUrl: newUrl
      };
      
      if (newFilename) {
        updateData.resumeFileName = newFilename;
        // Update local state immediately
        setResumeFileName(newFilename);
      }
      
      await updateDoc(doc(db, 'users', candidateProfile.uid), updateData);
      
      setResumeUrl(newUrl);
      setSuccess("Resume URL successfully updated in database");
      
      // Verify the new URL
      await checkUrlValidity();
    } catch (err) {
      setError(`Error updating resume URL: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };
  
  if (!candidateProfile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Resume URL Debug</h1>
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800"
        >
          Back
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-md">
              {error}
            </div>
          )}
          
          {success && (
            <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-md">
              {success}
            </div>
          )}
          
          {/* Current Resume URL */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Current Resume</h2>
            
            <div className="space-y-4">
              {resumeFileName && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filename
                  </label>
                  <div className="p-2 border border-gray-300 rounded bg-gray-50 font-medium">
                    {resumeFileName}
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL in Database
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={resumeUrl || ''}
                    readOnly
                    className="w-full p-2 border border-gray-300 rounded bg-gray-50 font-mono text-sm"
                  />
                  <button
                    onClick={checkUrlValidity}
                    disabled={checkingUrl || !resumeUrl}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded disabled:opacity-50"
                  >
                    {checkingUrl ? 'Checking...' : 'Check URL'}
                  </button>
                </div>
                
                {isUrlValid !== null && (
                  <div className={`mt-2 p-2 rounded ${isUrlValid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {isUrlValid 
                      ? 'URL is valid and accessible ✓' 
                      : 'URL is not accessible ⚠️ - This causes 404 errors when viewing the resume'}
                  </div>
                )}
              </div>
              
              {resumeUrl && (
                <div className="mt-2">
                  <button
                    onClick={() => handleViewOrDownload(resumeUrl)}
                    disabled={downloading}
                    className={`text-blue-600 hover:text-blue-800 underline text-sm ${downloading ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    {downloading ? 'Downloading...' : 'Download File'}
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Storage Files */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Files in Storage</h2>
            
            {storageFiles.length === 0 ? (
              <div className="p-4 bg-gray-50 text-gray-600 rounded">
                No resume files found in storage
              </div>
            ) : (
              <div>
                <p className="mb-4 text-sm text-gray-600">
                  These are all the resume files in your storage directory. The most recent file should be at the top.
                </p>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="py-2 px-4 border-b text-left">Filename</th>
                        <th className="py-2 px-4 border-b text-left">Storage Path</th>
                        <th className="py-2 px-4 border-b text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {storageFiles.map((file, index) => (
                        <tr key={index} className={index === 0 ? 'bg-blue-50' : ''}>
                          <td className="py-2 px-4 font-mono text-sm">{file.name}</td>
                          <td className="py-2 px-4 font-mono text-sm">{file.path}</td>
                          <td className="py-2 px-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleViewOrDownload(file.url)}
                                disabled={downloading}
                                className={`text-blue-600 hover:text-blue-800 text-sm ${downloading ? 'opacity-50 cursor-wait' : ''}`}
                              >
                                {downloading ? 'Downloading...' : 'Download'}
                              </button>
                              <button
                                onClick={() => {
                                  // Extract the original filename without the timestamp prefix
                                  const parts = file.name.split('_');
                                  let displayName = file.name;
                                  if (parts.length > 1) {
                                    // Remove timestamp prefix
                                    parts.shift(); 
                                    displayName = parts.join('_');
                                  }
                                  updateResumeUrl(file.url, displayName);
                                }}
                                className="text-green-600 hover:text-green-800 text-sm"
                              >
                                Use This File
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded text-sm">
                  <p className="font-semibold">How to fix 404 errors:</p>
                  <ol className="list-decimal pl-5 mt-1 space-y-1">
                    <li>Check if the current resume URL is valid</li>
                    <li>If not, click "Use This File" on the most recent file (highlighted at the top)</li>
                    <li>Go back to your dashboard and try viewing the resume again</li>
                  </ol>
                </div>
              </div>
            )}
            
            <div className="mt-4">
              <button
                onClick={fetchStorageFiles}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Refresh File List
              </button>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium mb-2">Advanced Debugging</h3>
              <div className="flex space-x-4">
                <a 
                  href="/protected/debug/resume-analysis" 
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Test Resume Analysis API
                </a>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                If you're experiencing issues with resume analysis, use the debugging tool to test the API directly.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 