/**
 * Script to standardize candidate profiles in Firestore
 * 
 * This script reads all candidate profiles from Firestore and standardizes them
 * by keeping only the specified fields and ensuring consistent data structure.
 */

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// Initialize Firebase
let serviceAccount;
try {
  serviceAccount = require('../service-account.json');
} catch (error) {
  console.error('❌ Error loading service account:', error.message);
  console.log('Make sure you have a valid service-account.json file in the project root.');
  process.exit(1);
}

// Initialize the Firebase Admin SDK
initializeApp({
  credential: require('firebase-admin/app').cert(serviceAccount)
});

// Get Firestore instance
const db = getFirestore();

// User role constants
const UserRoles = {
  CANDIDATE: 'candidate',
  RECRUITER: 'recruiter'
};

// Standard fields that each candidate profile should have
const standardCandidateFields = [
  'createdAt',
  'displayName',
  'email',
  'lastLogin',
  'resumeAnalysis', 
  'resumeFileName',
  'resumeUrl',
  'role',
  'targetCompanies',
  'uid',
  'updatedAt'
];

/**
 * Standardize a candidate profile
 * @param {Object} profile - The original profile data
 * @returns {Object} The standardized profile
 */
function standardizeProfile(profile) {
  const standardProfile = {};

  // Always keep these required fields
  standardProfile.uid = profile.uid;
  standardProfile.email = profile.email || '';
  standardProfile.displayName = profile.displayName || '';
  standardProfile.role = UserRoles.CANDIDATE;
  
  // Handle dates
  standardProfile.createdAt = profile.createdAt || new Date();
  standardProfile.lastLogin = profile.lastLogin || new Date();
  standardProfile.updatedAt = profile.updatedAt || new Date();
  
  // Optional fields - only include if they exist
  if (profile.resumeUrl) standardProfile.resumeUrl = profile.resumeUrl;
  if (profile.resumeFileName) standardProfile.resumeFileName = profile.resumeFileName;
  if (profile.resumeAnalysis) standardProfile.resumeAnalysis = profile.resumeAnalysis;
  if (profile.targetCompanies) standardProfile.targetCompanies = profile.targetCompanies;
  
  return standardProfile;
}

/**
 * Get all candidates from Firestore
 */
async function getAllCandidates() {
  try {
    console.log('📊 Fetching all candidate profiles from Firestore...');
    
    // Query all users with role = 'candidate'
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('role', '==', UserRoles.CANDIDATE).get();
    
    if (snapshot.empty) {
      console.log('No candidate profiles found');
      return [];
    }
    
    console.log(`Found ${snapshot.size} candidate profiles`);
    
    // Extract data from each document
    const candidates = [];
    snapshot.forEach(doc => {
      candidates.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return candidates;
  } catch (error) {
    console.error('Error getting candidates:', error);
    throw error;
  }
}

/**
 * Update a candidate profile in Firestore
 */
async function updateCandidateProfile(uid, profileData) {
  try {
    const userRef = db.collection('users').doc(uid);
    await userRef.set(profileData, { merge: false }); // Use merge: false to replace the entire document
    return true;
  } catch (error) {
    console.error(`Error updating profile for ${uid}:`, error);
    return false;
  }
}

/**
 * Create a backup of existing profiles
 */
async function backupProfiles(candidates) {
  try {
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `candidate_profiles_backup_${timestamp}.json`);
    
    fs.writeFileSync(backupFile, JSON.stringify(candidates, null, 2));
    console.log(`✅ Backup created at: ${backupFile}`);
    return true;
  } catch (error) {
    console.error('Error creating backup:', error);
    return false;
  }
}

/**
 * Main function to standardize all candidate profiles
 */
async function standardizeAllCandidateProfiles() {
  try {
    // Get all candidates
    const candidates = await getAllCandidates();
    
    if (candidates.length === 0) {
      console.log('No candidates to standardize');
      return;
    }
    
    // Create backup before making changes
    await backupProfiles(candidates);
    
    console.log('🔄 Standardizing profiles...');
    
    // Track success and failure
    let success = 0;
    let failure = 0;
    let skipped = 0;
    
    // Process each candidate
    for (const candidate of candidates) {
      // Skip if not a candidate (additional safety check)
      if (candidate.role !== UserRoles.CANDIDATE) {
        console.log(`Skipping user ${candidate.uid} (${candidate.email}) - not a candidate`);
        skipped++;
        continue;
      }
      
      // Standardize profile
      const standardProfile = standardizeProfile(candidate);
      
      // Update in Firestore
      const updated = await updateCandidateProfile(candidate.uid, standardProfile);
      
      if (updated) {
        success++;
        console.log(`✅ Updated profile for ${candidate.uid} (${candidate.email})`);
      } else {
        failure++;
        console.log(`❌ Failed to update profile for ${candidate.uid} (${candidate.email})`);
      }
    }
    
    console.log('\n===== STANDARDIZATION COMPLETE =====');
    console.log(`Total profiles: ${candidates.length}`);
    console.log(`Successfully updated: ${success}`);
    console.log(`Failed to update: ${failure}`);
    console.log(`Skipped: ${skipped}`);
    
  } catch (error) {
    console.error('Error standardizing profiles:', error);
  }
}

// Run the script
console.log('🚀 Starting candidate profile standardization...');
standardizeAllCandidateProfiles()
  .then(() => {
    console.log('✅ Profile standardization process completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Process failed:', error);
    process.exit(1);
  }); 