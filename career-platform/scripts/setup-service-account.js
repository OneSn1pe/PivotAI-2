const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('=== Firebase Service Account Setup ===');
console.log('\nThis script will help you set up your Firebase service account credentials.');
console.log('\nTo get your service account credentials:');
console.log('1. Go to Firebase console (https://console.firebase.google.com/)');
console.log('2. Select your project "pivotai-7f6ef"');
console.log('3. Go to Project settings > Service accounts');
console.log('4. Click "Generate new private key"');
console.log('5. Save the JSON file');
console.log('6. Use the contents of that file to fill in the prompts below\n');

const serviceAccountPath = path.resolve(process.cwd(), 'service-account.json');
let serviceAccountTemplate = {
  "type": "service_account",
  "project_id": "pivotai-7f6ef",
  "private_key_id": "",
  "private_key": "",
  "client_email": "",
  "client_id": "",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "",
  "universe_domain": "googleapis.com"
};

// Load existing service account if it exists
try {
  const existingContent = fs.readFileSync(serviceAccountPath, 'utf8');
  serviceAccountTemplate = JSON.parse(existingContent);
  console.log('Loaded existing service-account.json file');
} catch (err) {
  console.log('No existing service-account.json found, creating a new one');
}

const askQuestion = (question, defaultValue) => {
  return new Promise((resolve) => {
    rl.question(`${question} ${defaultValue ? `(current: ${defaultValue.substring(0, 10)}...)` : ''}: `, (answer) => {
      resolve(answer || defaultValue);
    });
  });
};

const setupServiceAccount = async () => {
  console.log('\nPlease enter the following information from your service account JSON:');
  
  serviceAccountTemplate.private_key_id = await askQuestion('private_key_id', serviceAccountTemplate.private_key_id);
  serviceAccountTemplate.private_key = await askQuestion('private_key (the entire key including BEGIN/END)', serviceAccountTemplate.private_key);
  serviceAccountTemplate.client_email = await askQuestion('client_email', serviceAccountTemplate.client_email || 'firebase-adminsdk@pivotai-7f6ef.iam.gserviceaccount.com');
  serviceAccountTemplate.client_id = await askQuestion('client_id', serviceAccountTemplate.client_id);
  serviceAccountTemplate.client_x509_cert_url = await askQuestion('client_x509_cert_url', serviceAccountTemplate.client_x509_cert_url);

  // Write the updated service account file
  fs.writeFileSync(serviceAccountPath, JSON.stringify(serviceAccountTemplate, null, 2));
  
  console.log('\n✅ Service account credentials have been updated successfully!');
  console.log(`File saved at: ${serviceAccountPath}`);
  console.log('\n⚠️ Important: Never commit this file to version control.');
  console.log('Make sure it is listed in your .gitignore file.');
  
  rl.close();
};

setupServiceAccount(); 