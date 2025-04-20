const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getStorage, ref, uploadString, getDownloadURL } = require('firebase/storage');
const { getFirestore, collection, addDoc } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('=== Firebase Debugging Protocol ===');

// 1. Check environment variables
console.log('\n1. Checking environment variables...');
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('❌ Missing environment variables:', missingEnvVars.join(', '));
  process.exit(1);
} else {
  console.log('✅ All required environment variables are present');
}

// 2. Initialize Firebase
console.log('\n2. Initializing Firebase...');
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

try {
  const app = initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');
  
  // 3. Test Storage directly (bypassing auth for test)
  console.log('\n3. Testing Firebase Storage directly...');
  const storage = getStorage(app);
  const testFileRef = ref(storage, 'debug-test.txt');
  
  uploadString(testFileRef, 'This is a test file for debugging')
    .then(() => {
      console.log('✅ Successfully uploaded test file to Firebase Storage');
      
      getDownloadURL(testFileRef)
        .then((url) => {
          console.log('✅ Successfully retrieved download URL:', url);
          
          // 4. Test Firestore
          console.log('\n4. Testing Firestore...');
          const db = getFirestore(app);
          
          addDoc(collection(db, 'debug-tests'), {
            timestamp: new Date(),
            success: true
          })
            .then(docRef => {
              console.log('✅ Successfully wrote to Firestore:', docRef.id);
              console.log('\n=== CORS Test Instructions ===');
              console.log('1. In your web browser, try to access this URL:');
              console.log(url);
              console.log('2. If you see an access denied error or CORS error, run:');
              console.log('   npm run fix-cors');
              console.log('\n✅ Firebase Storage and Firestore are working correctly!');
              console.log('\nNOTE: Authentication needs to be tested in a browser environment.');
              console.log('To test authentication, run the application and try to sign in.');
              process.exit(0);
            })
            .catch(error => {
              console.error('❌ Firestore test failed:', error);
              process.exit(1);
            });
        })
        .catch((error) => {
          console.error('❌ Failed to get download URL:', error);
          console.log('\nCORS Issue Detected! This is likely a CORS configuration problem.');
          console.log('Please run: npm run fix-cors');
          process.exit(1);
        });
    })
    .catch((error) => {
      console.error('❌ Storage upload test failed:', error);
      if (error.message.includes('permission-denied')) {
        console.log('\nPermission Denied! Check your Firebase Storage Rules:');
        console.log('1. Make sure your storage.rules file allows write access');
        console.log('2. Deploy your storage rules with: npm run deploy-storage-rules');
      }
      process.exit(1);
    });
  
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  process.exit(1);
} 