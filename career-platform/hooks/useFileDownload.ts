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

      // Use the Firebase Storage SDK to get the blob directly instead of fetch
      // This avoids CORS issues since the SDK handles authentication properly
      try {
        console.log('Using Firebase Storage SDK to get blob directly');
        const blob = await getBlob(fileRef);
        
        // Verify the blob has content
        if (blob.size === 0) {
          console.error('Downloaded blob has zero size');
          throw new Error('Downloaded file is empty');
        }
        
        console.log(`Successfully created blob of size ${blob.size} bytes using Storage SDK`);
        
        // Create a local blob URL
        const blobUrl = URL.createObjectURL(blob);
        
        setDownloading(false);
        return blobUrl;
      } catch (blobError) {
        console.error('Error getting blob directly from Firebase:', blobError);
        
        // Fallback: Use a server-side proxy to avoid CORS issues
        try {
          console.log('Falling back to server-side proxy for file download');
          
          // Use a server proxy endpoint to avoid CORS (must be implemented on server)
          const proxyUrl = `/api/proxy-storage?path=${encodeURIComponent(path)}`;
          console.log(`Using proxy URL: ${proxyUrl}`);
          
          const response = await fetch(proxyUrl);
          if (!response.ok) {
            throw new Error(`Proxy download failed with status: ${response.status}`);
          }
          
          const contentType = response.headers.get('content-type');
          console.log(`Proxy response content type: ${contentType}`);
          
          const proxyBlob = await response.blob();
          if (proxyBlob.size === 0) {
            throw new Error('Proxy returned empty file');
          }
          
          console.log(`Successfully got blob through proxy: ${proxyBlob.size} bytes`);
          const proxyBlobUrl = URL.createObjectURL(proxyBlob);
          
          setDownloading(false);
          return proxyBlobUrl;
        } catch (proxyError) {
          console.error('Proxy download failed:', proxyError);
          
          // Last resort: Try a direct download with a workaround for desktop browsers
          console.log('Using direct download as last resort (may encounter CORS in browsers)');
          
          // For many browsers, this will download directly without CORS checks
          const directBlobUrl = downloadUrl;
          setDownloading(false);
          return directBlobUrl;
        }
      }
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
      
      // Don't revoke URL for direct download URLs from Firebase
      if (!blobUrl.includes('firebasestorage.googleapis.com')) {
        // Clean up the blob URL to avoid memory leaks
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      }
      
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