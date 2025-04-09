const { Storage } = require('@google-cloud/storage');

// Initialize storage with your project credentials
const storage = new Storage({
  projectId: 'pivotai-7f6ef',
  keyFilename: './service-account.json'
});

const bucketName = 'pivotai-7f6ef.appspot.com';

async function configureCORS() {
  try {
    const bucket = storage.bucket(bucketName);
    
    // Read CORS configuration from file
    const corsConfiguration = require('./cors.json');
    
    // Set CORS configuration on the bucket
    await bucket.setCorsConfiguration(corsConfiguration);
    console.log(`CORS configuration set successfully for bucket: ${bucketName}`);
  } catch (error) {
    console.error('Error setting CORS configuration:', error);
  }
}

configureCORS(); 