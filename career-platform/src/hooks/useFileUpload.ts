import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { storage, auth } from '@/config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  // Helper function to delete all files in a directory
  const deleteFilesInDirectory = async (directoryPath: string): Promise<void> => {
    try {
      const directoryRef = ref(storage, directoryPath);
      const filesList = await listAll(directoryRef);
      
      // Delete each file in the directory
      const deletionPromises = filesList.items.map(fileRef => deleteObject(fileRef));
      await Promise.all(deletionPromises);
      
      console.log(`Deleted ${filesList.items.length} previous files in ${directoryPath}`);
    } catch (error) {
      console.error('Error deleting previous files:', error);
      // Continue with upload even if deletion fails
    }
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Check if user is authenticated
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated to upload files');
      }

      // Delete any existing files in the directory before uploading
      await deleteFilesInDirectory(path);

      const storageRef = ref(storage, `${path}/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgress(progress);
          },
          (error) => {
            setError(error.message);
            setUploading(false);
            reject(error);
          },
          async () => {
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              setUrl(downloadUrl);
              setUploading(false);
              resolve(downloadUrl);
            } catch (downloadError) {
              console.error('Error getting download URL:', downloadError);
              setError('Failed to get download URL');
              setUploading(false);
              reject(downloadError);
            }
          }
        );
      });
    } catch (err) {
      console.error('Upload error:', err);
      setError('An error occurred during upload');
      setUploading(false);
      throw err;
    }
  };

  return { uploadFile, uploading, progress, error, url };
}