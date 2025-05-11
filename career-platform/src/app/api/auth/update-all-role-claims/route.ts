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
    console.log('[Firebase Admin] SDK initialized successfully in update-all-role-claims API');
  } catch (error) {
    console.error('[Firebase Admin] SDK initialization error in update-all-role-claims API:', error);
  }
}

// Helper function to set role claim
async function setUserRoleClaim(uid: string, role: string): Promise<void> {
  if (!adminAuth) throw new Error('Firebase Admin Auth not initialized');
  
  try {
    // Get current custom claims
    const user = await adminAuth.getUser(uid);
    const currentClaims = user.customClaims || {};
    
    // Update with role claim
    await adminAuth.setCustomUserClaims(uid, {
      ...currentClaims,
      role
    });
    
    console.log(`[Firebase Admin] Set role claim "${role}" for user: ${uid}`);
    return;
  } catch (error) {
    console.error('[Firebase Admin] Error setting custom claims:', error);
    throw error;
  }
}

// API to update all users' role claims from Firestore data
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
    
    // This API should be protected or only accessible to admins in production
    // For now, we'll use a simple check for development vs production
    if (process.env.NODE_ENV === 'production' && process.env.ADMIN_SECRET) {
      const { authorization } = await request.json();
      if (authorization !== process.env.ADMIN_SECRET) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }
    
    // Get all users from Firestore
    const usersSnapshot = await adminDb.collection('users').get();
    
    if (usersSnapshot.empty) {
      return NextResponse.json({
        success: false,
        message: 'No users found in the database'
      });
    }
    
    const results = {
      total: usersSnapshot.size,
      updated: 0,
      skipped: 0,
      errors: [] as string[]
    };
    
    // Process each user
    const updatePromises = usersSnapshot.docs.map(async (doc) => {
      try {
        const userData = doc.data();
        const uid = doc.id;
        
        if (!userData.role) {
          results.skipped++;
          return;
        }
        
        // Set role claim
        await setUserRoleClaim(uid, userData.role);
        results.updated++;
      } catch (error: any) {
        results.errors.push(`Error updating user ${doc.id}: ${error.message}`);
      }
    });
    
    // Wait for all updates to complete
    await Promise.all(updatePromises);
    
    return NextResponse.json({
      success: true,
      message: `Updated ${results.updated} of ${results.total} users`,
      results
    });
  } catch (error: any) {
    console.error('Error updating all role claims:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update role claims' },
      { status: 500 }
    );
  }
} 