import { useState } from 'react';
import { ref, getBlob, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '@/config/firebase';

export function useFileDownload() {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  /**
   * Get the appropriate MIME type based on file extension
   */
  const getMimeTypeFromFilename = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
      'rtf': 'application/rtf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
    };
    
    return mimeTypes[extension] || 'application/octet-stream';
  };

  /**
   * Download a file from Firebase Storage and create a blob URL for it
   * @param path The path to the file in Firebase Storage
   * @returns A Promise resolving to a local blob URL that can be used for downloading
   */
  const downloadFile = async (path: string): Promise<{url: string, blob: Blob}> => {
    setDownloading(true);
    setError(null);

    try {
      // Check if user is authenticated
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated to download files');
      }

      // Create reference to the file
      const fileRef = ref(storage, path);

      // First get a download URL from Firebase
      const downloadUrl = await getDownloadURL(fileRef);
      setUrl(downloadUrl);
      
      // Fetch the file as a blob
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      
      // Get the file as a blob
      const blob = await response.blob();
      
      // Create a local blob URL
      const blobUrl = URL.createObjectURL(blob);
      
      setDownloading(false);
      return { url: blobUrl, blob };
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
      const { url: blobUrl, blob } = await downloadFile(path);
      
      // Set filename - either custom or from the path
      const filename = customFilename || getFilenameFromPath(path);
      
      // Determine the appropriate MIME type
      const mimeType = getMimeTypeFromFilename(filename);
      
      // Create a new blob with the correct content type
      const typedBlob = new Blob([blob], { type: mimeType });
      const typedBlobUrl = URL.createObjectURL(typedBlob);
      
      // Create an invisible link and trigger a download
      const link = document.createElement('a');
      link.href = typedBlobUrl;
      link.setAttribute('download', filename);
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URLs to avoid memory leaks
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
        URL.revokeObjectURL(typedBlobUrl);
      }, 100);
      
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