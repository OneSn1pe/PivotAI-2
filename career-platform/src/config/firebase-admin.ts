import * as admin from 'firebase-admin';
import logger from '@/utils/logger';

// Create namespaced logger
const log = logger.createNamespace('FirebaseAdmin');

// Check if we're in a browser environment (client-side)
const isBrowser = typeof window !== 'undefined';

// Check if we're in build time (prevent initialization)
const isBuildTime = !process.env.FIREBASE_PROJECT_ID && !process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

// Enhanced interface for Firebase Admin App
interface FirebaseAdminApp {
  app: admin.app.App;
  auth: admin.auth.Auth;
  db: admin.firestore.Firestore;
}

// Singleton state
let firebaseAdmin: admin.app.App | undefined;
let adminAuth: admin.auth.Auth | null = null;
let adminDb: admin.firestore.Firestore | null = null;
let initializationError: Error | null = null;
let isInitializing = false;

// Enhanced initialization function with proper error handling
async function getFirebaseAdminApp(): Promise<FirebaseAdminApp | null> {
  // Only initialize on server-side and not during build time
  if (isBrowser) {
    log.warn('Firebase Admin SDK cannot be initialized in browser environment');
    return null;
  }

  // Skip initialization during build time
  if (isBuildTime) {
    log.info('Build time detected - skipping Firebase Admin initialization');
    return null;
  }

  // Return cached error if initialization previously failed
  if (initializationError) {
    log.error('Firebase Admin SDK initialization previously failed:', initializationError.message);
    return null;
  }
  
  try {
    // If already initialized, return existing instance
    if (firebaseAdmin && adminAuth && adminDb) {
      return { app: firebaseAdmin, auth: adminAuth, db: adminDb };
    }

    // Prevent concurrent initialization
    if (isInitializing) {
      log.warn('Firebase Admin SDK initialization already in progress');
      return null;
    }

    isInitializing = true;
    
    // Try to get an existing app
    try {
      firebaseAdmin = admin.app();
      log.info('Using existing Firebase Admin app');
    } catch {
      // Initialize Firebase Admin SDK only if not already initialized
      if (!admin.apps.length) {
        log.info('Initializing Firebase Admin SDK');
        
        try {
          // Use environment variables for Firebase Admin initialization
          if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            try {
              const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
              firebaseAdmin = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
              });
              log.info('Firebase Admin initialized with service account from environment');
            } catch (parseError) {
              throw new Error(`Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON: ${parseError}`);
            }
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
            log.info('Firebase Admin initialized with individual environment variables');
          } else {
            const missingVars = [];
            if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
              if (!process.env.FIREBASE_PROJECT_ID) missingVars.push('FIREBASE_PROJECT_ID');
              if (!process.env.FIREBASE_CLIENT_EMAIL) missingVars.push('FIREBASE_CLIENT_EMAIL');
              if (!process.env.FIREBASE_PRIVATE_KEY) missingVars.push('FIREBASE_PRIVATE_KEY');
            }
            const errorMsg = `Missing Firebase Admin environment variables: ${missingVars.join(', ')}`;
            throw new Error(errorMsg);
          }
          
          if (firebaseAdmin) {
            log.info('Firebase Admin SDK initialized successfully');
          }
        } catch (error) {
          initializationError = error instanceof Error ? error : new Error(String(error));
          log.error('Firebase Admin SDK initialization error:', initializationError);
          throw initializationError;
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
        
        // Test the services to ensure they work
        await adminAuth.listUsers(1); // Test auth service
        log.info('Firebase Admin services verified successfully');
        
        return { app: firebaseAdmin, auth: adminAuth, db: adminDb };
      } catch (error) {
        initializationError = error instanceof Error ? error : new Error(String(error));
        log.error('Error initializing Firebase Admin services:', initializationError);
        
        // Clean up on failure
        adminAuth = null;
        adminDb = null;
        throw initializationError;
      }
    }
    
    throw new Error('Firebase Admin app not initialized');
  } catch (error) {
    initializationError = error instanceof Error ? error : new Error(String(error));
    log.error('Unexpected error during Firebase Admin initialization:', initializationError);
    throw initializationError;
  } finally {
    isInitializing = false;
  }
}

// Safe wrapper for getting admin services
export async function getAdminServices(): Promise<FirebaseAdminApp | null> {
  if (isBrowser) return null;
  return await getFirebaseAdminApp();
}

// Legacy sync exports for backward compatibility (may return null if not initialized)
export { adminAuth, adminDb };

// Function to set custom claims for a user
export async function setUserRoleClaim(uid: string, role: string): Promise<void> {
  // Get admin auth on demand to ensure it's initialized
  const services = await getFirebaseAdminApp();
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
  const services = await getFirebaseAdminApp();
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
  const services = await getFirebaseAdminApp();
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

// Export the admin SDK and functions
export { firebaseAdmin, getFirebaseAdminApp }; 