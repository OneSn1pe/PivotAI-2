// Script to clear all users from Firebase Auth and Firestore
// Run with: node scripts/clear-all-users.js

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, '../firebase-admin-key.json');

try {
  const serviceAccount = require(serviceAccountPath);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
  
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:');
  console.error('Make sure firebase-admin-key.json exists in the career-platform directory');
  process.exit(1);
}

const auth = admin.auth();
const db = admin.firestore();

async function deleteAllUsers() {
  console.log('\n🔥 Starting to delete all users and their data...\n');
  
  try {
    // Step 1: Get all users from Firebase Auth
    console.log('📋 Fetching all users from Firebase Auth...');
    const listUsersResult = await auth.listUsers(1000);
    const users = listUsersResult.users;
    console.log(`Found ${users.length} users to delete`);
    
    if (users.length === 0) {
      console.log('✅ No users found. Database is already clean.');
      return;
    }
    
    // Step 2: Delete user data from Firestore collections
    console.log('\n🗑️  Deleting user data from Firestore...');
    
    const collections = [
      'users',           // User profiles
      'roadmaps',        // Career roadmaps
      'userProgress',    // Progress tracking
      'achievements',    // User achievements
      'activities',      // Activity logs
      'notifications'    // User notifications
    ];
    
    for (const collectionName of collections) {
      console.log(`\n📁 Processing collection: ${collectionName}`);
      
      try {
        const collectionRef = db.collection(collectionName);
        const snapshot = await collectionRef.get();
        
        if (snapshot.empty) {
          console.log(`   ✓ Collection ${collectionName} is empty`);
          continue;
        }
        
        console.log(`   Found ${snapshot.size} documents to delete`);
        
        // Delete in batches to avoid hitting limits
        const batch = db.batch();
        let batchCount = 0;
        
        for (const doc of snapshot.docs) {
          batch.delete(doc.ref);
          batchCount++;
          
          // Commit batch every 500 documents
          if (batchCount === 500) {
            await batch.commit();
            console.log(`   ✓ Deleted ${batchCount} documents`);
            batchCount = 0;
          }
        }
        
        // Commit remaining documents
        if (batchCount > 0) {
          await batch.commit();
          console.log(`   ✓ Deleted ${batchCount} documents`);
        }
        
        console.log(`   ✅ Completed deleting collection: ${collectionName}`);
      } catch (error) {
        console.error(`   ❌ Error deleting collection ${collectionName}:`, error.message);
      }
    }
    
    // Step 3: Delete users from Firebase Auth
    console.log('\n👤 Deleting users from Firebase Auth...');
    
    const userIds = users.map(user => user.uid);
    
    // Delete users in batches of 100
    const batchSize = 100;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      
      try {
        await auth.deleteUsers(batch);
        console.log(`   ✓ Deleted ${Math.min(batchSize, userIds.length - i)} users (${i + batch.length}/${userIds.length})`);
      } catch (error) {
        console.error(`   ❌ Error deleting batch of users:`, error.message);
      }
    }
    
    // Step 4: Verify deletion
    console.log('\n🔍 Verifying deletion...');
    const remainingUsers = await auth.listUsers(1);
    console.log(`   Remaining users: ${remainingUsers.users.length}`);
    
    console.log('\n✅ User deletion process completed!');
    
  } catch (error) {
    console.error('\n❌ Error during deletion process:', error);
  } finally {
    // Terminate the admin app
    await admin.app().delete();
    process.exit(0);
  }
}

// Confirmation prompt
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('⚠️  WARNING: This will permanently delete ALL users and their data!');
console.log('This action cannot be undone.\n');

rl.question('Are you sure you want to continue? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes') {
    rl.close();
    deleteAllUsers();
  } else {
    console.log('\n❌ Operation cancelled');
    rl.close();
    process.exit(0);
  }
});