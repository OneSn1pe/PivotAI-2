import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, getFirebaseAdminApp } from '@/config/firebase-admin';
import { UserRole } from '@/types/user';
import { normalizeRole } from '@/utils/environment';

// Mark this file as server-only
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Ensure Firebase Admin is initialized
    const services = getFirebaseAdminApp();
    if (!services || !services.auth || !services.db) {
      console.error('[normalize-all-roles] Firebase Admin not initialized');
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    // Get all users from Firestore
    const usersSnapshot = await services.db.collection('users').get();
    
    const results = {
      total: usersSnapshot.size,
      processed: 0,
      updated: 0,
      errors: 0,
      details: [] as any[]
    };
    
    // Process each user
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const uid = userDoc.id;
      
      results.processed++;
      
      try {
        // Get user from Auth
        const userRecord = await services.auth.getUser(uid);
        const currentClaims = userRecord.customClaims || {};
        
        // Get role from Firestore
        const firestoreRole = userData.role;
        
        if (!firestoreRole) {
          results.details.push({
            uid,
            status: 'skipped',
            reason: 'No role in Firestore'
          });
          continue;
        }
        
        // Normalize the role
        let normalizedRole: string;
        
        if (normalizeRole(firestoreRole) === normalizeRole(UserRole.RECRUITER)) {
          normalizedRole = UserRole.RECRUITER;
        } else if (normalizeRole(firestoreRole) === normalizeRole(UserRole.CANDIDATE)) {
          normalizedRole = UserRole.CANDIDATE;
        } else {
          normalizedRole = firestoreRole; // Keep as is if not matching known roles
        }
        
        // Check if update is needed
        if (currentClaims.role !== normalizedRole) {
          // Update custom claims
          await services.auth.setCustomUserClaims(uid, {
            ...currentClaims,
            role: normalizedRole
          });
          
          results.updated++;
          results.details.push({
            uid,
            status: 'updated',
            oldRole: currentClaims.role || 'none',
            newRole: normalizedRole
          });
        } else {
          results.details.push({
            uid,
            status: 'unchanged',
            role: currentClaims.role
          });
        }
      } catch (error) {
        results.errors++;
        results.details.push({
          uid,
          status: 'error',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('[normalize-all-roles] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 