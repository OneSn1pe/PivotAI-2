import React, { useState, useEffect } from 'react';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '@/config/firebase';

export default function ResumeStorageDebug() {
  const [files, setFiles] = useState<{name: string, path: string, url: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userStoragePath, setUserStoragePath] = useState<string>('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get current user
        const user = auth.currentUser;
        
        if (!user) {
          setError('User not authenticated');
          setLoading(false);
          return;
        }
        
        const storagePath = `resumes/${user.uid}`;
        setUserStoragePath(storagePath);
        
        // List files in the user's resume directory
        const storageRef = ref(storage, storagePath);
        
        try {
          const result = await listAll(storageRef);
          
          // Get download URLs for each file
          const filePromises = result.items.map(async (item) => {
            try {
              const url = await getDownloadURL(item);
              return {
                name: item.name,
                path: item.fullPath,
                url
              };
            } catch (urlErr) {
              console.error(`Failed to get URL for ${item.name}:`, urlErr);
              return {
                name: item.name,
                path: item.fullPath,
                url: '(URL fetch failed)'
              };
            }
          });
          
          const fileDetails = await Promise.all(filePromises);
          setFiles(fileDetails);
        } catch (listErr) {
          // Directory may not exist yet, which is fine
          console.log('No files found or directory does not exist:', listErr);
          setFiles([]);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Error checking storage: ' + (err instanceof Error ? err.message : String(err)));
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const handleTestFile = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Resume Storage Debug</h2>
      
      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="p-3 bg-red-50 text-red-700 rounded mb-4">
          {error}
        </div>
      ) : (
        <div>
          <p className="mb-2 text-sm text-gray-600">
            Storage path: <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">{userStoragePath}</code>
          </p>
          
          {files.length === 0 ? (
            <div className="p-4 bg-gray-50 text-gray-600 rounded">
              No resume files found in storage
            </div>
          ) : (
            <div>
              <p className="mb-2 text-sm font-medium">Files found ({files.length}):</p>
              <div className="border rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Path</th>
                      <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {files.map((file, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2 font-mono text-xs truncate max-w-[150px]">
                          {file.name}
                        </td>
                        <td className="px-4 py-2 font-mono text-xs truncate max-w-[200px]">
                          {file.path}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => handleTestFile(file.url)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Test URL
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded text-sm">
                <strong>Note:</strong> If viewing a file results in a 404 error, it may be due to:
                <ul className="list-disc pl-5 mt-1">
                  <li>Incorrect storage bucket configuration</li>
                  <li>Firebase security rules blocking access</li>
                  <li>File path issues in the storage reference</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 