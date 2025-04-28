import { useState } from 'react';
import { ref, getBlob, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '@/config/firebase';

export function useFileDownload() {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  /**
   * Download a file from Firebase Storage and create a blob URL for it
   * @param path The path to the file in Firebase Storage
   * @returns A Promise resolving to a local blob URL that can be used for downloading
   */
  const downloadFile = async (path: string): Promise<string> => {
    setDownloading(true);
    setError(null);

    try {
      // Check if user is authenticated
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated to download files');
      }

      console.log(`Starting download for file: ${path}`);
      
      // Create reference to the file
      const fileRef = ref(storage, path);

      // First get a download URL from Firebase
      const downloadUrl = await getDownloadURL(fileRef);
      console.log(`Got authenticated download URL for ${path}`);
      setUrl(downloadUrl);
      
      // Fetch the file as a blob using the authenticated URL
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        console.error(`Failed to fetch file with authenticated URL. Status: ${response.status}`);
        throw new Error(`Failed to download file (HTTP ${response.status})`);
      }
      
      // Verify the content type and size
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      console.log(`File metadata - Type: ${contentType}, Size: ${contentLength} bytes`);
      
      // Check for valid size
      if (contentLength && parseInt(contentLength, 10) < 100) {
        console.error(`Suspiciously small file: ${contentLength} bytes`);
        throw new Error('File appears to be empty or corrupt');
      }
      
      // Get the file as a blob
      const blob = await response.blob();
      
      // Verify the blob has content
      if (blob.size === 0) {
        console.error('Downloaded blob has zero size');
        throw new Error('Downloaded file is empty');
      }
      
      console.log(`Successfully created blob of size ${blob.size} bytes`);
      
      // Create a local blob URL
      const blobUrl = URL.createObjectURL(blob);
      
      setDownloading(false);
      return blobUrl;
    } catch (err) {
      console.error('Download error:', err);
      setError('An error occurred during download');
      setDownloading(false);
      throw err;
    }
  };

  /**
   * Extract a filename from a Firebase Storage path
   */
  const getFilenameFromPath = (path: string): string => {
    const pathParts = path.split('/');
    return pathParts[pathParts.length - 1] || 'file';
  };

  /**
   * Download a file and trigger browser download dialog
   */
  const downloadAndSaveFile = async (path: string, customFilename?: string): Promise<void> => {
    try {
      setDownloading(true);
      
      // Get the blob URL for the file
      const blobUrl = await downloadFile(path);
      
      // Create an invisible link and trigger a download
      const link = document.createElement('a');
      link.href = blobUrl;
      
      // Set filename - either custom or from the path
      const filename = customFilename || getFilenameFromPath(path);
      link.setAttribute('download', filename);
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL to avoid memory leaks
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      
      console.log(`Download dialog triggered for ${filename}`);
      setDownloading(false);
    } catch (err) {
      console.error('Download and save error:', err);
      setError('An error occurred while trying to download the file');
      setDownloading(false);
      throw err;
    }
  };

  return { 
    downloadFile, 
    downloadAndSaveFile,
    downloading, 
    error, 
    url 
  };
} 