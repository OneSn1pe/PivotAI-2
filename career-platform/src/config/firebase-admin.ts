import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    // Use service account credentials if available
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // If the service account is provided as a JSON string (e.g., in environment variables)
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      // Otherwise use the default application credentials
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Replace escaped newlines in the private key
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        }),
      });
    }
    
    console.log('[Firebase Admin] SDK initialized successfully');
  } catch (error) {
    console.error('[Firebase Admin] SDK initialization error:', error);
  }
}

// Export the admin SDK and Firestore database
export const firebaseAdmin = admin;
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();

// Function to set custom claims for a user
export async function setUserRoleClaim(uid: string, role: string): Promise<void> {
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

// Function to get a user's custom claims
export async function getUserClaims(uid: string): Promise<any> {
  try {
    const user = await adminAuth.getUser(uid);
    return user.customClaims || {};
  } catch (error) {
    console.error('[Firebase Admin] Error getting user claims:', error);
    throw error;
  }
}

// Function to verify and refresh a Firebase ID token
export async function verifyToken(token: string): Promise<admin.auth.DecodedIdToken> {
  try {
    return await adminAuth.verifyIdToken(token, true); // Force token refresh
  } catch (error) {
    console.error('[Firebase Admin] Token verification error:', error);
    throw error;
  }
} 