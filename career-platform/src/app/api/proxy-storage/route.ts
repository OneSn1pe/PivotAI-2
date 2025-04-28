import { NextRequest, NextResponse } from 'next/server';
import { getStorage, ref, getBlob, getDownloadURL } from 'firebase/storage';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getStorage as getAdminStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : undefined;

  if (!serviceAccount) {
    console.warn('No Firebase service account found, proxy may not work correctly');
  }

  try {
    initializeApp({
      credential: serviceAccount ? cert(serviceAccount) : undefined,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'pivotai-7f6ef.appspot.com',
    });
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
  }
}

/**
 * Server-side proxy for Firebase Storage files to avoid CORS issues
 * This endpoint fetches files from Firebase Storage and serves them directly,
 * bypassing any CORS restrictions that might affect client-side requests.
 */
export async function GET(request: NextRequest) {
  console.log('Storage proxy request received');
  
  try {
    // Get the file path from the URL parameters
    const url = new URL(request.url);
    const path = url.searchParams.get('path');
    
    if (!path) {
      return NextResponse.json(
        { error: 'Missing required parameter: path' },
        { status: 400 }
      );
    }
    
    console.log(`Proxying Firebase Storage file: ${path}`);
    
    try {
      // Get a reference to the Firebase Storage bucket
      const adminStorage = getAdminStorage().bucket();
      
      // Get the file from Firebase Storage
      const [file] = await adminStorage.file(path).download();
      
      // Get file metadata for content type
      const [metadata] = await adminStorage.file(path).getMetadata();
      const contentType = metadata.contentType || 'application/octet-stream';
      
      console.log(`File downloaded, size: ${file.length} bytes, type: ${contentType}`);
      
      // Create response with appropriate headers
      const response = new NextResponse(file, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${path.split('/').pop()}"`,
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
        },
      });
      
      return response;
    } catch (adminError) {
      console.error('Admin SDK error, falling back to client SDK:', adminError);
      
      // Fallback to Firebase client SDK if admin fails
      // Initialize Firebase client SDK
      const storage = getStorage();
      const fileRef = ref(storage, path);
      
      // Get the download URL
      const downloadUrl = await getDownloadURL(fileRef);
      console.log('Got download URL:', downloadUrl);
      
      // Create a server-side fetch to the URL
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }
      
      // Get the file content
      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();
      
      // Create response with appropriate headers
      const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
      
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${path.split('/').pop()}"`,
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  } catch (error) {
    console.error('Storage proxy error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to proxy storage file',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
} 