import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
let firebaseAdmin: admin.app.App | undefined;
let adminAuth: admin.auth.Auth | null = null;
let adminDb: admin.firestore.Firestore | null = null;

try {
  // Try to get an existing app
  firebaseAdmin = admin.app();
  adminAuth = firebaseAdmin.auth();
  adminDb = firebaseAdmin.firestore();
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
    adminDb = firebaseAdmin.firestore();
    console.log('[Firebase Admin] SDK initialized successfully in set-role-claim API');
  } catch (error) {
    console.error('[Firebase Admin] SDK initialization error in set-role-claim API:', error);
  }
}

// API to set role claim for a user
export async function POST(request: Request) {
  try {
    // Ensure Firebase services are initialized
    if (!adminAuth || !adminDb) {
      console.error('Firebase services not initialized');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const { uid, role } = await request.json();
    
    if (!uid) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    if (!role) {
      // If role not provided, fetch from Firestore
      try {
        const userDoc = await adminDb.collection('users').doc(uid).get();
        
        if (!userDoc.exists) {
          return NextResponse.json(
            { error: 'User not found in database' },
            { status: 404 }
          );
        }
        
        const userData = userDoc.data();
        if (!userData?.role) {
          return NextResponse.json(
            { error: 'User has no role in database' },
            { status: 400 }
          );
        }
        
        // Set the role from the database
        const user = await adminAuth.getUser(uid);
        const currentClaims = user.customClaims || {};
        
        await adminAuth.setCustomUserClaims(uid, {
          ...currentClaims,
          role: userData.role
        });
        
        return NextResponse.json({
          success: true,
          message: `Role claim set from database: ${userData.role}`,
          claims: { ...currentClaims, role: userData.role }
        });
      } catch (error: any) {
        console.error('Error fetching user role from Firestore:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to fetch user role' },
          { status: 500 }
        );
      }
    }
    
    // If role was provided, set it directly
    try {
      const user = await adminAuth.getUser(uid);
      const currentClaims = user.customClaims || {};
      
      await adminAuth.setCustomUserClaims(uid, {
        ...currentClaims,
        role
      });
      
      return NextResponse.json({
        success: true,
        message: `Role claim set manually: ${role}`,
        claims: { ...currentClaims, role }
      });
    } catch (error: any) {
      console.error('Error setting role claim:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to set role claim' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in set-role-claim API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
} 