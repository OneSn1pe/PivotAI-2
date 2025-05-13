import { initializeApp, getApps } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Check if we're in development mode
const isDevelopment = process.env.NEXT_PUBLIC_DEVELOPMENT_MODE === 'true' ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost');

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Detect production vs development environment
const isProduction = process.env.NODE_ENV === 'production';
const isLocalhost = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

console.log(`[Firebase Config] Running in ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'} mode`);
console.log(`[Firebase Config] Auth domain: ${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}`);
console.log(`[Firebase Config] Environment: ${isProduction ? 'production' : 'development'}`);
console.log(`[Firebase Config] Hostname: ${isBrowser ? window.location.hostname : 'server'}`);

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
if (isBrowser) {
  setPersistence(auth, browserLocalPersistence)
    .catch((error) => {
      console.error('Error setting auth persistence:', error);
    });
}

const db = getFirestore(app);
const storage = getStorage(app);

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
    console.log(`[Firebase Config] Set session cookie with options: ${cookieOptions.join(', ')}`);
    
    return true;
  } catch (err) {
    console.error('[Firebase Config] Error setting session cookie:', err);
    return false;
  }
}

// In development mode, modify the cookie settings
if (isBrowser) {
  // Set up auth state listener to maintain session cookie
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      try {
        const token = await user.getIdToken();
        setSessionCookie(token);
        console.log('[Firebase Config] Updated session cookie on auth state change');
      } catch (err) {
        console.error('[Firebase Config] Error setting cookie on auth state change:', err);
      }
    } else {
      console.log('[Firebase Config] User signed out, clearing session cookie');
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

export { app, auth, db, storage, isDevelopment, isProduction };