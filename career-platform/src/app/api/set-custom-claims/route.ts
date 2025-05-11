import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
let firebaseAdmin: admin.app.App | undefined;
let adminAuth: admin.auth.Auth | null = null;

try {
  // Try to get an existing app
  firebaseAdmin = admin.app();
  adminAuth = firebaseAdmin.auth();
} catch {
  // Initialize a new app if none exists
  try {
    // Use service account credentials if available
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // If the service account is provided as a JSON string
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      
      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      // Otherwise use the default application credentials
      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Replace escaped newlines in the private key
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        }),
      });
    }
    
    adminAuth = firebaseAdmin.auth();
    console.log('[Firebase Admin] SDK initialized successfully in API route');
  } catch (error) {
    console.error('[Firebase Admin] SDK initialization error in API route:', error);
  }
}

// API to set custom claims for a user
export async function POST(request: Request) {
  try {
    // Check if Firebase Admin SDK is initialized
    if (!adminAuth) {
      console.error('Firebase Admin SDK not initialized');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const { uid, customClaims } = await request.json();
    
    if (!uid) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    if (!customClaims || typeof customClaims !== 'object') {
      return NextResponse.json(
        { error: 'Custom claims must be a valid object' },
        { status: 400 }
      );
    }
    
    // Get current claims
    const user = await adminAuth.getUser(uid);
    const currentClaims = user.customClaims || {};
    
    // Merge with new claims
    const newClaims = { ...currentClaims, ...customClaims };
    
    // Set the custom claims
    await adminAuth.setCustomUserClaims(uid, newClaims);
    
    return NextResponse.json({
      success: true,
      message: 'Custom claims updated successfully',
      claims: newClaims
    });
  } catch (error: any) {
    console.error('Error setting custom claims:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set custom claims' },
      { status: 500 }
    );
  }
} 