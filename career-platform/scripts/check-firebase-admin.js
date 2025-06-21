#!/usr/bin/env node

/**
 * Script to check Firebase Admin SDK configuration
 * This helps diagnose API route connection issues
 */

console.log('Checking Firebase Admin SDK configuration...\n');

// Check required environment variables
const requiredVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL', 
  'FIREBASE_PRIVATE_KEY'
];

const missingVars = [];
const presentVars = [];

requiredVars.forEach(varName => {
  if (process.env[varName]) {
    presentVars.push(varName);
  } else {
    missingVars.push(varName);
  }
});

console.log('✅ Present environment variables:');
presentVars.forEach(v => console.log(`  - ${v}`));

if (missingVars.length > 0) {
  console.log('\n❌ Missing environment variables:');
  missingVars.forEach(v => console.log(`  - ${v}`));
  
  console.log('\n📝 To fix this issue:');
  console.log('1. Make sure you have a .env.local file with these variables');
  console.log('2. For Vercel deployment, add these in the Vercel dashboard');
  console.log('3. The FIREBASE_PRIVATE_KEY should include the full private key with \\n characters');
  console.log('\nExample .env.local:');
  console.log('FIREBASE_PROJECT_ID=your-project-id');
  console.log('FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com');
  console.log('FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_KEY_HERE\\n-----END PRIVATE KEY-----\\n"');
} else {
  console.log('\n✅ All required environment variables are present!');
  
  // Check if private key format looks correct
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey && !privateKey.includes('BEGIN PRIVATE KEY')) {
    console.log('\n⚠️  Warning: FIREBASE_PRIVATE_KEY might not be formatted correctly');
    console.log('   Make sure it includes the BEGIN/END markers and \\n characters');
  }
}

// Try to initialize Firebase Admin
console.log('\n🔧 Testing Firebase Admin initialization...');
try {
  const admin = require('firebase-admin');
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      })
    });
  }
  
  console.log('✅ Firebase Admin SDK initialized successfully!');
  
  // Try to access Firestore
  const db = admin.firestore();
  console.log('✅ Firestore instance created successfully!');
  
} catch (error) {
  console.log('❌ Failed to initialize Firebase Admin SDK:');
  console.error(error.message);
  
  if (error.message.includes('project_id')) {
    console.log('\n💡 This usually means the environment variables are not loaded properly.');
  }
}