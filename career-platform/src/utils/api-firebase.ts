/**
 * Utility for API routes to get Firebase Admin services
 * This ensures API routes use the server-side Firebase Admin SDK
 * instead of the client-side Firebase SDK
 */

import { getAdminServices } from '@/config/firebase-admin';
import { NextResponse } from 'next/server';

export async function getAdminFirestore() {
  const adminServices = await getAdminServices();
  
  if (!adminServices || !adminServices.db) {
    throw new Error('Firebase Admin not initialized. Check environment variables.');
  }
  
  return adminServices.db;
}

export function handleFirebaseError(error: any) {
  console.error('[API Firebase Error]', error);
  
  // Check for common Firebase offline error
  if (error.message?.includes('client is offline')) {
    return NextResponse.json(
      { 
        error: 'Database connection failed',
        details: 'Unable to connect to Firebase. Please check server configuration.',
        timestamp: new Date().toISOString()
      },
      { status: 503 } // Service Unavailable
    );
  }
  
  // Check for missing admin initialization
  if (error.message?.includes('Firebase Admin not initialized')) {
    return NextResponse.json(
      { 
        error: 'Server configuration error',
        details: 'Firebase Admin SDK not properly configured. Check environment variables.',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
  
  // Generic error response
  return NextResponse.json(
    { 
      error: 'Internal server error',
      details: error.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    },
    { status: 500 }
  );
}