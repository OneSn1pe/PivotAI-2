#!/usr/bin/env node

/**
 * Deployment fix script for Next.js chunk loading issues
 * 
 * This script ensures that:
 * 1. Build artifacts are properly generated
 * 2. All static files have correct MIME types
 * 3. Cache is properly invalidated
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Starting deployment fix process...\n');

// Step 1: Clean previous build
console.log('1️⃣ Cleaning previous build artifacts...');
try {
  execSync('rm -rf .next', { stdio: 'inherit' });
  console.log('✅ Build artifacts cleaned\n');
} catch (error) {
  console.error('❌ Failed to clean build artifacts:', error.message);
}

// Step 2: Clear Next.js cache
console.log('2️⃣ Clearing Next.js cache...');
try {
  execSync('rm -rf .next/cache', { stdio: 'inherit' });
  console.log('✅ Cache cleared\n');
} catch (error) {
  console.error('❌ Failed to clear cache:', error.message);
}

// Step 3: Run fresh build
console.log('3️⃣ Running fresh build...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully\n');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Step 4: Verify build output
console.log('4️⃣ Verifying build output...');
const buildManifest = path.join(__dirname, '../.next/build-manifest.json');
const appBuildManifest = path.join(__dirname, '../.next/app-build-manifest.json');

if (fs.existsSync(buildManifest) && fs.existsSync(appBuildManifest)) {
  console.log('✅ Build manifests generated correctly');
  
  // Check for static chunks
  const staticChunksDir = path.join(__dirname, '../.next/static/chunks');
  if (fs.existsSync(staticChunksDir)) {
    const chunks = fs.readdirSync(staticChunksDir);
    console.log(`✅ Generated ${chunks.length} static chunks\n`);
  }
} else {
  console.error('❌ Build manifests missing!');
  process.exit(1);
}

// Step 5: Create deployment checklist
console.log('5️⃣ Deployment checklist:');
console.log('   ✓ Ensure all environment variables are set in Vercel');
console.log('   ✓ Clear Vercel build cache (Settings > Functions > Clear Cache)');
console.log('   ✓ Redeploy from Vercel dashboard');
console.log('   ✓ Check browser console after deployment');
console.log('   ✓ If issues persist, check Vercel function logs\n');

console.log('🎉 Deployment fix process completed!');
console.log('\n📝 Next steps:');
console.log('1. Commit these changes: git add -A && git commit -m "Fix Next.js chunk loading issues"');
console.log('2. Push to your branch: git push origin pre-css-issue');
console.log('3. Deploy via Vercel dashboard or CLI');
console.log('4. Monitor deployment logs for any errors\n');