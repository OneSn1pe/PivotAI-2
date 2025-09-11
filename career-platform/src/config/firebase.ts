import { initializeApp, getApps } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import logger from '@/utils/logger';

// Create a namespaced logger for Firebase config
const log = logger.createNamespace('Firebase');

// Check if we're in development mode
const isDevelopment = process.env.NEXT_PUBLIC_DEVELOPMENT_MODE === 'true' ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost');

// Check if we're in build time (no API keys available)
const isBuildTime = !process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Detect production vs development environment
const isProduction = process.env.NODE_ENV === 'production';
const isLocalhost = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

log.info(`Running in ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'} mode`);
log.info(`Auth domain: ${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}`);
log.info(`Environment: ${isProduction ? 'production' : 'development'}`);
log.info(`Hostname: ${isBrowser ? window.location.hostname : 'server'}`);

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'build-time-placeholder',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'build-time.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'build-time-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'build-time-project.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abcdef',
};

// Initialize Firebase (skip during build time to avoid errors)
let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;

if (!isBuildTime) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} else {
  log.info('Build time detected - skipping Firebase initialization');
}

// Set persistence to LOCAL to prevent frequent session timeouts
// Only run in browser context and when auth is available
if (isBrowser && auth && !isBuildTime) {
  setPersistence(auth, browserLocalPersistence)
    .catch((error) => {
      log.error('Error setting auth persistence:', error);
    });
}

// db and storage are already initialized above

// Helper function to set session cookie with appropriate settings
export function setSessionCookie(token: string) {
  if (!isBrowser) return;
  
  try {
    const cookieOptions = [];
    cookieOptions.push(`session=${token}`);
    cookieOptions.push(`path=/`);
    cookieOptions.push(`max-age=3600`); // 1 hour
    
    // Set SameSite attribute based on environment
    if (isProduction && !isLocalhost) {
      cookieOptions.push(`SameSite=Strict`);
      cookieOptions.push(`Secure`); // Only use Secure in production and non-localhost
    } else {
      cookieOptions.push(`SameSite=Lax`);
    }
    
    // Set the cookie
    document.cookie = cookieOptions.join('; ');
    log.info(`Set session cookie with options: ${cookieOptions.join(', ')}`);
    
    return true;
  } catch (err) {
    log.error('Error setting session cookie:', err);
    return false;
  }
}

// Set up auth state listener to maintain session cookie
// Only run in browser context and when auth is available
if (isBrowser && auth && !isBuildTime) {
  // Set up auth state listener to maintain session cookie
  auth.onAuthStateChanged(async (user: any) => {
    if (user) {
      try {
        const token = await user.getIdToken();
        setSessionCookie(token);
        log.info('Updated session cookie on auth state change');
      } catch (err) {
        log.error('Error setting cookie on auth state change:', err);
      }
    } else {
      log.info('User signed out, clearing session cookie');
      document.cookie = 'session=; path=/; max-age=0';
    }
  });
  
  // You can also connect to Firebase emulators here if needed
  // Example:
  // if (isDevelopment) {
  //   connectFirestoreEmulator(db, 'localhost', 8080);
  //   connectStorageEmulator(storage, 'localhost', 9199);
  // }
}

export { app, auth, db, storage, isDevelopment, isProduction, isBuildTime };