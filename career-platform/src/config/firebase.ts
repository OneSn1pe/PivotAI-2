import { initializeApp, getApps } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Check if we're in development mode
const isDevelopment = process.env.NEXT_PUBLIC_DEVELOPMENT_MODE === 'true' ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost');

console.log(`[Firebase Config] Running in ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'} mode`);
console.log(`[Firebase Config] Auth domain: ${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}`);

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
  setPersistence(auth, browserLocalPersistence)
    .catch((error) => {
      console.error('Error setting auth persistence:', error);
    });
}

const db = getFirestore(app);
const storage = getStorage(app);

// In development mode, modify the cookie settings
if (isDevelopment && typeof window !== 'undefined') {
  console.log('[Firebase Config] Setting up for local development');
  
  // Override the default cookie domain and path for development
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      try {
        const token = await user.getIdToken();
        // For localhost, we don't need to specify domain
        document.cookie = `session=${token}; path=/; max-age=3600; SameSite=Lax`;
        console.log('[Firebase Config] Set session cookie for development');
      } catch (err) {
        console.error('[Firebase Config] Error setting development cookie:', err);
      }
    }
  });
  
  // You can also connect to Firebase emulators here if needed
  // Example:
  // if (isDevelopment) {
  //   connectFirestoreEmulator(db, 'localhost', 8080);
  //   connectStorageEmulator(storage, 'localhost', 9199);
  // }
}

export { app, auth, db, storage, isDevelopment };