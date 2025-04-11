import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '@/config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

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

      // Get a fresh token
      const token = await user.getIdToken();

      const storageRef = ref(storage, `${path}/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file, {
        customMetadata: {
          'firebaseStorageDownloadTokens': token
        }
      });

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
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            setUrl(downloadUrl);
            setUploading(false);
            resolve(downloadUrl);
          }
        );
      });
    } catch (err) {
      setError('An error occurred during upload');
      setUploading(false);
      throw err;
    }
  };

  return { uploadFile, uploading, progress, error, url };
}