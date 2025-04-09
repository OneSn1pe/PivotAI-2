const fs = require('fs');
const path = require('path');

function checkBuildOutput() {
  console.log('Verifying build output...');
  
  const buildDir = path.join(process.cwd(), '.next');
  const requiredFiles = [
    'build-manifest.json',
    'prerender-manifest.json',
    'routes-manifest.json',
    'server/pages-manifest.json'
  ];
  
  // Check if .next directory exists
  if (!fs.existsSync(buildDir)) {
    throw new Error('.next directory not found. Build may have failed.');
  }
  
  // Check for required build files
  for (const file of requiredFiles) {
    const filePath = path.join(buildDir, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Required build file ${file} not found.`);
    }
  }
  
  // Check build manifest for pages
  const buildManifest = require(path.join(buildDir, 'build-manifest.json'));
  const pages = Object.keys(buildManifest.pages || {});
  
  if (pages.length === 0) {
    throw new Error('No pages found in build manifest.');
  }
  
  // Check for critical pages
  const criticalPages = [
    '/',
    '/auth/login',
    '/auth/register',
    '/protected/dashboard'
  ];
  
  const missingPages = criticalPages.filter(page => 
    !pages.includes(page) && !pages.includes(`/pages${page}`)
  );
  
  if (missingPages.length > 0) {
    throw new Error(`Critical pages missing from build: ${missingPages.join(', ')}`);
  }
  
  // Check server build
  const serverDir = path.join(buildDir, 'server');
  if (!fs.existsSync(serverDir)) {
    throw new Error('Server build directory not found.');
  }
  
  // Check for environment variables
  const envVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    'OPENAI_API_KEY'
  ];
  
  const missingEnvVars = envVars.filter(v => !process.env[v]);
  if (missingEnvVars.length > 0) {
    throw new Error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
  }
  
  console.log('Build verification completed successfully!');
  console.log(`Found ${pages.length} pages in build output.`);
  return true;
}

// Run verification if called directly
if (require.main === module) {
  try {
    checkBuildOutput();
  } catch (error) {
    console.error('Build verification failed:', error.message);
    process.exit(1);
  }
}

module.exports = checkBuildOutput; 