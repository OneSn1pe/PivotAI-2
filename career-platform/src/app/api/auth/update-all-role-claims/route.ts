import { NextResponse } from 'next/server';
import { setUserRoleClaim, adminDb } from '@/config/firebase-admin';

// API to update all users' role claims from Firestore data
export async function POST(request: Request) {
  try {
    // This API should be protected or only accessible to admins in production
    // For now, we'll use a simple check for development vs production
    if (process.env.NODE_ENV === 'production' && process.env.ADMIN_SECRET) {
      const { authorization } = await request.json();
      if (authorization !== process.env.ADMIN_SECRET) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }
    
    // Get all users from Firestore
    const usersSnapshot = await adminDb.collection('users').get();
    
    if (usersSnapshot.empty) {
      return NextResponse.json({
        success: false,
        message: 'No users found in the database'
      });
    }
    
    const results = {
      total: usersSnapshot.size,
      updated: 0,
      skipped: 0,
      errors: [] as string[]
    };
    
    // Process each user
    const updatePromises = usersSnapshot.docs.map(async (doc) => {
      try {
        const userData = doc.data();
        const uid = doc.id;
        
        if (!userData.role) {
          results.skipped++;
          return;
        }
        
        // Set role claim
        await setUserRoleClaim(uid, userData.role);
        results.updated++;
      } catch (error: any) {
        results.errors.push(`Error updating user ${doc.id}: ${error.message}`);
      }
    });
    
    // Wait for all updates to complete
    await Promise.all(updatePromises);
    
    return NextResponse.json({
      success: true,
      message: `Updated ${results.updated} of ${results.total} users`,
      results
    });
  } catch (error: any) {
    console.error('Error updating all role claims:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update role claims' },
      { status: 500 }
    );
  }
} 