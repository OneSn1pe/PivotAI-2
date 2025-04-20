const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('=== Firebase Storage CORS Configuration ===');

const corsPath = path.resolve(process.cwd(), 'cors.json');
const defaultCors = [
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Content-Length", "Content-Disposition", "Content-Encoding", "Authorization", "X-Requested-With"]
  }
];

// Check if cors.json already exists
let corsExists = false;
try {
  fs.accessSync(corsPath, fs.constants.F_OK);
  corsExists = true;
  console.log('✅ Found existing cors.json configuration file');
} catch (err) {
  console.log('❌ cors.json file not found, creating a new one with recommended settings');
  fs.writeFileSync(corsPath, JSON.stringify(defaultCors, null, 2));
  console.log('✅ Created new cors.json file');
}

// Ask for confirmation to update CORS configuration
rl.question('\nDo you want to update the Firebase Storage CORS configuration? (y/n): ', (answer) => {
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    console.log('\nUpdating CORS configuration...');
    
    // Check if service-account.json exists
    try {
      fs.accessSync(path.resolve(process.cwd(), 'service-account.json'), fs.constants.F_OK);
    } catch (err) {
      console.error('❌ service-account.json file not found. You need valid service account credentials to update CORS.');
      console.log('Please run the setup-service-account.js script first.');
      rl.close();
      return;
    }
    
    // Run gsutil cors set command
    const command = `npx -y firebase-tools storage:cors --config cors.json`;
    
    console.log(`Executing: ${command}`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error updating CORS configuration:', error.message);
        console.log('Try running the command manually:');
        console.log('npx -y firebase-tools storage:cors --config cors.json');
        rl.close();
        return;
      }
      
      console.log(stdout);
      
      if (stderr) {
        console.warn('Warning:', stderr);
      }
      
      console.log('✅ CORS configuration has been updated successfully!');
      console.log('\nTo verify the CORS settings:');
      console.log('1. Upload a file to Firebase Storage');
      console.log('2. Try to access it from your application');
      console.log('3. Check browser console for CORS errors');
      
      rl.close();
    });
  } else {
    console.log('CORS configuration update skipped.');
    rl.close();
  }
}); 