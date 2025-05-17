'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db, storage } from '@/config/firebase';
import { ref, getDownloadURL, listAll } from 'firebase/storage';
import { UserRole } from '@/types/user';

export default function ResumeStorageDebug() {
  const { userProfile } = useAuth();
  const [userId, setUserId] = useState<string>('');
  const [userDetails, setUserDetails] = useState<any>(null);
  const [resumeFiles, setResumeFiles] = useState<any[]>([]);
  const [fileAccessResults, setFileAccessResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchingStorage, setFetchingStorage] = useState<boolean>(false);
  const [userLookupError, setUserLookupError] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile && userProfile.uid) {
      setUserId(userProfile.uid);
    }
  }, [userProfile]);

  const fetchUserDetails = async () => {
    if (!userId.trim()) {
      setUserLookupError('Please enter a user ID');
      return;
    }

    setLoading(true);
    setUserDetails(null);
    setResumeFiles([]);
    setFileAccessResults({});
    setError(null);
    setUserLookupError(null);

    try {
      // Get user document
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        setUserLookupError(`User with ID ${userId} not found`);
        setLoading(false);
        return;
      }

      const userData = userDoc.data();
      setUserDetails(userData);

      // Fetch resume files from storage if this is a candidate
      if (userData.role === UserRole.CANDIDATE) {
        await fetchResumeFiles();
      }
    } catch (err) {
      setError(`Error fetching user details: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchResumeFiles = async () => {
    try {
      setFetchingStorage(true);
      
      // Get all files in the user's resume directory
      const storageRef = ref(storage, `resumes/${userId}`);
      const filesResult = await listAll(storageRef);
      
      if (filesResult.items.length === 0) {
        setResumeFiles([]);
        return;
      }
      
      // Process each file to get metadata and test access
      const filePromises = filesResult.items.map(async (fileRef) => {
        const fileInfo = {
          name: fileRef.name,
          fullPath: fileRef.fullPath,
          accessTime: null as number | null,
          url: null as string | null,
          error: null as string | null,
          size: null as string | null,
          isAccessible: false,
          isOriginal: fileRef.name.includes('original_'),
          isPlaintext: fileRef.name.includes('plaintext'),
          timestamp: extractTimestampFromFilename(fileRef.name),
        };
        
        // Test access to the file
        try {
          const startTime = performance.now();
          const downloadUrl = await getDownloadURL(fileRef);
          const endTime = performance.now();
          
          fileInfo.accessTime = Math.round(endTime - startTime);
          fileInfo.url = downloadUrl;
          fileInfo.isAccessible = true;
          
          // Test HEAD request to check URL validity
          try {
            const response = await fetch(downloadUrl, { method: 'HEAD' });
            if (response.ok) {
              fileInfo.size = response.headers.get('Content-Length') || 'Unknown';
            }
          } catch (headErr) {
            console.warn('HEAD request failed:', headErr);
          }
        } catch (accessErr) {
          fileInfo.error = accessErr instanceof Error ? accessErr.message : String(accessErr);
        }
        
        return fileInfo;
      });
      
      const files = await Promise.all(filePromises);
      
      // Sort by timestamp (newest first)
      const sortedFiles = files.sort((a, b) => {
        if (!a.timestamp && !b.timestamp) return 0;
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        return b.timestamp - a.timestamp;
      });
      
      setResumeFiles(sortedFiles);
    } catch (err) {
      setError(`Error fetching resume files: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setFetchingStorage(false);
    }
  };

  const testProfileUrlAccess = async () => {
    if (!userDetails || !userDetails.resumeUrl) {
      return;
    }
    
    setFileAccessResults(prev => ({
      ...prev,
      profileUrl: { testing: true }
    }));
    
    try {
      // Test fetch with HEAD request
      const startTime = performance.now();
      const response = await fetch(userDetails.resumeUrl, { method: 'HEAD' });
      const endTime = performance.now();
      
      setFileAccessResults(prev => ({
        ...prev,
        profileUrl: {
          url: userDetails.resumeUrl,
          status: response.status,
          statusText: response.statusText,
          latency: Math.round(endTime - startTime),
          headers: Object.fromEntries(response.headers.entries()),
          testing: false,
          success: response.ok
        }
      }));
    } catch (err) {
      setFileAccessResults(prev => ({
        ...prev,
        profileUrl: {
          url: userDetails.resumeUrl,
          error: err instanceof Error ? err.message : String(err),
          testing: false,
          success: false
        }
      }));
    }
    
    // Also test storage paths if available
    if (userDetails.originalResumePath) {
      await testStoragePath('originalResumePath', userDetails.originalResumePath);
    }
    
    if (userDetails.plaintextResumePath) {
      await testStoragePath('plaintextResumePath', userDetails.plaintextResumePath);
    }
  };
  
  const testStoragePath = async (pathType: string, storagePath: string) => {
    setFileAccessResults(prev => ({
      ...prev,
      [pathType]: { testing: true }
    }));
    
    try {
      // Test access via Firebase Storage
      const startTime = performance.now();
      const fileRef = ref(storage, storagePath);
      const downloadUrl = await getDownloadURL(fileRef);
      const endTime = performance.now();
      
      // Test fetch with HEAD request
      let urlValid = false;
      let headResponse = null;
      
      try {
        const response = await fetch(downloadUrl, { method: 'HEAD' });
        urlValid = response.ok;
        headResponse = {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        };
      } catch (headErr) {
        // URL fetch failed
      }
      
      setFileAccessResults(prev => ({
        ...prev,
        [pathType]: {
          path: storagePath,
          url: downloadUrl,
          storageLatency: Math.round(endTime - startTime),
          testing: false,
          success: true,
          urlValid,
          headResponse
        }
      }));
    } catch (err) {
      setFileAccessResults(prev => ({
        ...prev,
        [pathType]: {
          path: storagePath,
          error: err instanceof Error ? err.message : String(err),
          testing: false,
          success: false
        }
      }));
    }
  };

  // Helper to extract timestamp from filename
  const extractTimestampFromFilename = (filename: string): number | null => {
    const matches = filename.match(/_(\d+)_/);
    return matches && matches[1] ? parseInt(matches[1]) : null;
  };

  // Renders the debug data in a collapsible JSON format
  const JsonDisplay = ({ data }: { data: any }) => {
    const [expanded, setExpanded] = useState(false);
    
    if (!data) return null;
    
    return (
      <div className="mb-2">
        <button 
          onClick={() => setExpanded(!expanded)}
          className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-sm mb-1"
        >
          {expanded ? 'Collapse' : 'Expand'} Details
        </button>
        
        {expanded && (
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-96">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Resume Storage Debug Tool</h1>
      <p className="mb-4 text-gray-600">This tool checks resume storage access and validates paths.</p>
      
      <div className="mb-6">
        <div className="flex items-end gap-2 mb-2">
          <div className="flex-grow">
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
              User ID
            </label>
            <input
              id="userId"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter user ID to check"
            />
          </div>
          <button
            onClick={fetchUserDetails}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Fetch User'}
          </button>
        </div>
        
        {userLookupError && (
          <div className="text-red-500 mb-2">{userLookupError}</div>
        )}
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {userDetails && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">User Details</h2>
          <div className="bg-gray-50 p-4 rounded-md mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p><span className="font-semibold">User ID:</span> {userId}</p>
                <p><span className="font-semibold">Name:</span> {userDetails.displayName || 'N/A'}</p>
                <p><span className="font-semibold">Email:</span> {userDetails.email || 'N/A'}</p>
                <p><span className="font-semibold">Role:</span> {userDetails.role || 'N/A'}</p>
              </div>
              
              {userDetails.role === UserRole.CANDIDATE && (
                <div>
                  <p>
                    <span className="font-semibold">Resume URL:</span> 
                    {userDetails.resumeUrl ? (
                      <button 
                        onClick={testProfileUrlAccess}
                        className="ml-2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
                      >
                        Test Access
                      </button>
                    ) : 'Not set'}
                  </p>
                  <p><span className="font-semibold">Resume File Name:</span> {userDetails.resumeFileName || 'N/A'}</p>
                  <p><span className="font-semibold">Original Resume Path:</span> {userDetails.originalResumePath || 'N/A'}</p>
                  <p><span className="font-semibold">Plaintext Resume Path:</span> {userDetails.plaintextResumePath || 'N/A'}</p>
                </div>
              )}
            </div>
          </div>
          
          {Object.keys(fileAccessResults).length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">URL Access Tests</h3>
              
              {Object.entries(fileAccessResults).map(([key, result]) => (
                <div key={key} className="mb-4">
                  <h4 className="font-medium">{key}</h4>
                  {result.testing ? (
                    <p>Testing access...</p>
                  ) : (
                    <div className="pl-4 border-l-2 border-gray-200">
                      <p className={result.success ? 'text-green-600' : 'text-red-600'}>
                        {result.success ? '✓ Accessible' : '✗ Not accessible'}
                      </p>
                      {result.url && (
                        <p className="text-sm truncate">
                          <span className="font-medium">URL:</span> {result.url}
                        </p>
                      )}
                      {result.path && (
                        <p className="text-sm truncate">
                          <span className="font-medium">Path:</span> {result.path}
                        </p>
                      )}
                      {result.latency && (
                        <p className="text-sm">
                          <span className="font-medium">Latency:</span> {result.latency}ms
                        </p>
                      )}
                      {result.error && (
                        <p className="text-sm text-red-600">{result.error}</p>
                      )}
                      
                      <JsonDisplay data={result} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {userDetails.role === UserRole.CANDIDATE && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Resume Files in Storage</h3>
                <button
                  onClick={fetchResumeFiles}
                  disabled={fetchingStorage}
                  className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
                >
                  {fetchingStorage ? 'Loading...' : 'Refresh Files'}
                </button>
              </div>
              
              {fetchingStorage ? (
                <p>Loading files from storage...</p>
              ) : resumeFiles.length === 0 ? (
                <p className="text-gray-500">No resume files found in storage.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">File Name</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Access</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {resumeFiles.map((file, index) => (
                        <tr key={index} className={file.isAccessible ? '' : 'bg-red-50'}>
                          <td className="px-3 py-2 text-sm">
                            <div className="truncate max-w-xs" title={file.name}>
                              {file.name}
                            </div>
                            <div className="text-xs text-gray-500 truncate">{file.fullPath}</div>
                          </td>
                          <td className="px-3 py-2 text-sm">
                            {file.isOriginal ? (
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Original</span>
                            ) : file.isPlaintext ? (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Plaintext</span>
                            ) : (
                              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">Unknown</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-sm">
                            {file.isAccessible ? (
                              <div>
                                <div className="text-green-600">✓ Accessible</div>
                                <div className="text-xs text-gray-600">{file.accessTime}ms</div>
                              </div>
                            ) : (
                              <div className="text-red-600">✗ Not accessible</div>
                            )}
                          </td>
                          <td className="px-3 py-2 text-sm">
                            {file.isAccessible ? (
                              <a 
                                href={file.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                Open
                              </a>
                            ) : (
                              file.error && (
                                <div className="text-xs text-red-600">{file.error}</div>
                              )
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          
          {userDetails.resumeAnalysis && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Resume Analysis</h3>
              <JsonDisplay data={userDetails.resumeAnalysis} />
            </div>
          )}
        </div>
      )}
    </div>
  );
} 