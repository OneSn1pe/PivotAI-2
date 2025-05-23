import * as admin from 'firebase-admin';

// Check if we're in a browser environment (client-side)
const isBrowser = typeof window !== 'undefined';

// Singleton pattern for Firebase Admin
interface FirebaseAdminApp {
  app: admin.app.App;
  auth: admin.auth.Auth;
  db: admin.firestore.Firestore;
}

// Don't attempt to initialize Firebase Admin SDK in browser
let firebaseAdmin: admin.app.App | undefined;
let adminAuth: admin.auth.Auth | null = null;
let adminDb: admin.firestore.Firestore | null = null;

// Singleton initialization function
function getFirebaseAdminApp(): FirebaseAdminApp | null {
  // Only initialize on server-side
  if (isBrowser) return null;
  
  try {
    // If already initialized, return existing instance
    if (firebaseAdmin && adminAuth && adminDb) {
      return { app: firebaseAdmin, auth: adminAuth, db: adminDb };
    }
    
    // Try to get an existing app
    try {
      firebaseAdmin = admin.app();
    } catch {
      // Initialize Firebase Admin SDK only if not already initialized
      if (!admin.apps.length) {
        console.log('[Firebase Admin] Initializing Firebase Admin SDK');
        
        try {
          // Use service account credentials if available
          if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            // If the service account is provided as a JSON string (e.g., in environment variables)
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            
            firebaseAdmin = admin.initializeApp({
              credential: admin.credential.cert(serviceAccount)
            });
          } else if (
            process.env.FIREBASE_PROJECT_ID && 
            process.env.FIREBASE_CLIENT_EMAIL && 
            process.env.FIREBASE_PRIVATE_KEY
          ) {
            // Use individual environment variables
            firebaseAdmin = admin.initializeApp({
              credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Replace escaped newlines in the private key
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
              }),
            });
          } else {
            console.warn('[Firebase Admin] Missing required environment variables for initialization');
            return null;
          }
          
          if (firebaseAdmin) {
            console.log('[Firebase Admin] SDK initialized successfully');
          }
        } catch (error) {
          console.error('[Firebase Admin] SDK initialization error:', error);
          return null;
        }
      } else {
        firebaseAdmin = admin.app();
      }
    }

    // Set up auth and firestore if initialized
    if (firebaseAdmin) {
      try {
        adminAuth = firebaseAdmin.auth();
        adminDb = firebaseAdmin.firestore();
        return { app: firebaseAdmin, auth: adminAuth, db: adminDb };
      } catch (error) {
        console.error('[Firebase Admin] Error initializing services:', error);
        return null;
      }
    }
    
    return null;
  } catch (error) {
    console.error('[Firebase Admin] Unexpected error during initialization:', error);
    return null;
  }
}

// Initialize admin services
const adminServices = isBrowser ? null : getFirebaseAdminApp();
if (!isBrowser && adminServices) {
  adminAuth = adminServices.auth;
  adminDb = adminServices.db;
}

// Function to set custom claims for a user
export async function setUserRoleClaim(uid: string, role: string): Promise<void> {
  // Get admin auth on demand to ensure it's initialized
  const services = getFirebaseAdminApp();
  if (!services || !services.auth) {
    throw new Error('Firebase Admin Auth not initialized');
  }

  try {
    // Get current custom claims
    const user = await services.auth.getUser(uid);
    const currentClaims = user.customClaims || {};
    
    // Update with role claim
    await services.auth.setCustomUserClaims(uid, {
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
  // Get admin auth on demand to ensure it's initialized
  const services = getFirebaseAdminApp();
  if (!services || !services.auth) {
    throw new Error('Firebase Admin Auth not initialized');
  }

  try {
    const user = await services.auth.getUser(uid);
    return user.customClaims || {};
  } catch (error) {
    console.error('[Firebase Admin] Error getting user claims:', error);
    throw error;
  }
}

// Function to verify and refresh a Firebase ID token
export async function verifyToken(token: string): Promise<admin.auth.DecodedIdToken> {
  // Get admin auth on demand to ensure it's initialized
  const services = getFirebaseAdminApp();
  if (!services || !services.auth) {
    throw new Error('Firebase Admin Auth not initialized');
  }

  try {
    return await services.auth.verifyIdToken(token, true); // Force token refresh
  } catch (error) {
    console.error('[Firebase Admin] Token verification error:', error);
    throw error;
  }
}

// Export the admin SDK and Firestore database
export { firebaseAdmin, adminAuth, adminDb, getFirebaseAdminApp }; 