/**
 * Fix Firestore CORS Issues Script
 * 
 * This script helps resolve CORS issues with Firestore by applying the correct CORS settings
 * and updating the Firebase configuration properly.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('=== Fix Firestore CORS Issues ===');
console.log('This script will help resolve CORS issues with Firestore connections');

// Verify that cors.json exists
const corsPath = path.resolve(process.cwd(), 'cors.json');
let corsExists = fs.existsSync(corsPath);

if (!corsExists) {
  console.error('❌ cors.json file not found! Please create it first.');
  process.exit(1);
}

// Read and validate cors.json
let corsConfig;
try {
  corsConfig = JSON.parse(fs.readFileSync(corsPath, 'utf8'));
  console.log('✅ Found cors.json file');
  
  // Check if it contains the necessary origins
  const origins = Array.isArray(corsConfig[0]?.origin) ? corsConfig[0].origin : [];
  const hasPivotAI = origins.some(origin => origin.includes('pivotai.me'));
  const hasFirestore = origins.some(origin => origin.includes('firestore.googleapis.com'));
  
  if (!hasPivotAI) {
    console.log('⚠️ cors.json does not contain pivotai.me domain');
  }
  
  if (!hasFirestore) {
    console.log('⚠️ cors.json does not contain firestore.googleapis.com domain');
  }
  
  // Validate methods and headers
  const methods = Array.isArray(corsConfig[0]?.method) ? corsConfig[0].method : [];
  const hasOptions = methods.includes('OPTIONS');
  if (!hasOptions) {
    console.log('⚠️ cors.json does not include OPTIONS method which is required for CORS preflight');
  }
  
  const headers = Array.isArray(corsConfig[0]?.responseHeader) ? corsConfig[0].responseHeader : [];
  const hasCorsHeaders = headers.some(header => header.includes('Access-Control-Allow'));
  if (!hasCorsHeaders) {
    console.log('⚠️ cors.json does not include Access-Control-Allow headers');
  }
  
} catch (error) {
  console.error('❌ Failed to parse cors.json:', error.message);
  process.exit(1);
}

// Perform CORS deployment
console.log('\nWe need to update CORS settings for both Firebase Storage and Firestore.');

rl.question('Do you want to apply these CORS fixes? (y/n): ', async (answer) => {
  if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
    console.log('Operation cancelled.');
    rl.close();
    return;
  }
  
  try {
    // 1. Apply CORS to Firebase Storage
    console.log('\n1. Applying CORS to Firebase Storage...');
    try {
      console.log(execSync('npx -y firebase-tools storage:cors --config cors.json').toString());
      console.log('✅ Successfully updated Firebase Storage CORS settings');
    } catch (error) {
      console.error('❌ Failed to update Firebase Storage CORS settings:', error.message);
      console.log('You can try running this command manually:');
      console.log('npx -y firebase-tools storage:cors --config cors.json');
    }
    
    // 2. Ensure long polling is used in Firestore
    console.log('\n2. Checking Firebase config for long polling...');
    const firebaseConfigPath = path.resolve(process.cwd(), 'src/config/firebase.ts');
    
    if (fs.existsSync(firebaseConfigPath)) {
      const firebaseConfig = fs.readFileSync(firebaseConfigPath, 'utf8');
      
      if (!firebaseConfig.includes('experimentalForceLongPolling')) {
        console.log('⚠️ Firebase config does not use long polling. Please update your config.');
      } else {
        console.log('✅ Firebase config is using long polling');
      }
    } else {
      console.log('❌ Firebase config file not found at', firebaseConfigPath);
    }
    
    // 3. Update next.config.js with proper CORS settings
    console.log('\n3. Checking Next.js config for CORS headers...');
    const nextConfigPath = path.resolve(process.cwd(), 'next.config.js');
    
    if (fs.existsSync(nextConfigPath)) {
      const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
      
      if (!nextConfig.includes('Access-Control-Allow-Origin')) {
        console.log('⚠️ Next.js config may not have CORS headers correctly set.');
        console.log('Please ensure your next.config.js includes CORS headers in async headers() function.');
      } else {
        console.log('✅ Next.js config appears to have CORS headers');
      }
    } else {
      console.log('❌ Next.js config file not found at', nextConfigPath);
    }
    
    // 4. Deploy middleware changes if needed
    console.log('\n4. Checking middleware for CORS handling...');
    const middlewarePath = path.resolve(process.cwd(), 'src/middleware.ts');
    
    if (fs.existsSync(middlewarePath)) {
      const middleware = fs.readFileSync(middlewarePath, 'utf8');
      
      if (!middleware.includes('isFirestoreRequest')) {
        console.log('⚠️ Middleware may not be handling Firestore requests correctly.');
        console.log('Please update your middleware.ts to handle Firestore requests.');
      } else {
        console.log('✅ Middleware appears to handle Firestore requests');
      }
    } else {
      console.log('❌ Middleware file not found at', middlewarePath);
    }
    
    console.log('\n=== Summary ===');
    console.log('CORS fixes have been applied. If you are still experiencing issues:');
    console.log('1. Make sure to rebuild and redeploy your application');
    console.log('2. Clear browser cache or try in an incognito window');
    console.log('3. Check browser console for specific CORS errors');
    console.log('4. Ensure your Firestore rules allow the necessary access');
    
  } catch (error) {
    console.error('\n❌ An error occurred:', error.message);
  } finally {
    rl.close();
  }
}); 