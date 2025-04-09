const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: 'pivotai-2-2',
  keyFilename: path.join(__dirname, '../service-account.json')
});

const bucketName = 'pivotai-2-2.appspot.com';
const corsConfigPath = path.join(__dirname, '../cors.json');

async function setupCors() {
  try {
    // Read CORS configuration
    const corsConfig = JSON.parse(fs.readFileSync(corsConfigPath, 'utf8'));
    
    // Get the bucket
    const bucket = storage.bucket(bucketName);
    
    // Set CORS configuration
    await bucket.setCorsConfiguration(corsConfig);
    
    console.log('CORS configuration has been successfully set.');
  } catch (error) {
    console.error('Error setting CORS configuration:', error);
    process.exit(1);
  }
}

setupCors(); 