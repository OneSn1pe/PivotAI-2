import { initializeApp, getApps } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, connectAuthEmulator } from 'firebase/auth';
import { 
  getFirestore, 
  connectFirestoreEmulator, 
  initializeFirestore, 
  enableIndexedDbPersistence, 
  Firestore,
  collection,
  query,
  limit,
  getDocs,
  FirestoreError
} from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Debug helper for tracing
const debug = {
  log: (...args: any[]) => console.log('[Firebase]', ...args),
  error: (...args: any[]) => console.error('[Firebase]', ...args),
  warn: (...args: any[]) => console.warn('[Firebase]', ...args),
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

// Set persistence to LOCAL to prevent frequent session timeouts
// Only run in browser context
if (typeof window !== 'undefined') {
  debug.log('Setting up Firebase in browser context');
  
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      debug.log('Auth persistence set to LOCAL');
    })
    .catch((error) => {
      debug.error('Error setting auth persistence:', error);
    });
}

// Initialize Firestore with specific settings to help with CORS issues
let db: Firestore;
try {
  // Use initializeFirestore with explicit settings to help with CORS
  db = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
    experimentalForceLongPolling: true, // Use long polling instead of WebSockets which can have CORS issues
    experimentalAutoDetectLongPolling: true,
  });
  
  // Enable offline persistence if in browser
  if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(db)
      .then(() => {
        debug.log('Firestore offline persistence enabled');
      })
      .catch((err: FirestoreError) => {
        if (err.code === 'failed-precondition') {
          debug.warn('Firestore persistence unavailable: multiple tabs open');
        } else if (err.code === 'unimplemented') {
          debug.warn('Firestore persistence unavailable: browser not supported');
        } else {
          debug.error('Error enabling Firestore persistence:', err);
        }
      });
  }
} catch (err) {
  debug.error('Error initializing Firestore with settings, falling back to default:', err);
  // Fallback to standard initialization
  db = getFirestore(app);
}

const storage = getStorage(app);

// Use emulators in development
if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
  debug.log('Using Firebase emulators for development');
  const EMULATOR_HOST = 'localhost';
  if (typeof window !== 'undefined') {
    connectAuthEmulator(auth, `http://${EMULATOR_HOST}:9099`);
    connectFirestoreEmulator(db, EMULATOR_HOST, 8080);
    connectStorageEmulator(storage, EMULATOR_HOST, 9199);
  }
}

// Utility function to check Firestore connection
export async function checkFirestoreConnection() {
  if (typeof window === 'undefined') return { connected: true }; // Server side is assumed connected
  
  try {
    // Try a simple query to see if we can connect to Firestore
    const testCollection = collection(db, '_connection_test');
    const testQuery = query(testCollection, limit(1));
    await getDocs(testQuery);
    return { connected: true };
  } catch (error: unknown) {
    const firestoreError = error as FirestoreError;
    debug.error('Firestore connection check failed:', firestoreError);
    return { 
      connected: false, 
      error: firestoreError,
      message: firestoreError.message,
      code: firestoreError.code
    };
  }
}

export { app, auth, db, storage };