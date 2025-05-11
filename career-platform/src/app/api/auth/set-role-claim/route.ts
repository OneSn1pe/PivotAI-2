import { NextResponse } from 'next/server';
import { setUserRoleClaim, getUserClaims, adminDb } from '@/config/firebase-admin';

// API to set role claim for a user
export async function POST(request: Request) {
  try {
    const { uid, role } = await request.json();
    
    if (!uid) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    if (!role) {
      // If role not provided, fetch from Firestore
      const userDoc = await adminDb.collection('users').doc(uid).get();
      
      if (!userDoc.exists) {
        return NextResponse.json(
          { error: 'User not found in database' },
          { status: 404 }
        );
      }
      
      const userData = userDoc.data();
      if (!userData?.role) {
        return NextResponse.json(
          { error: 'User has no role in database' },
          { status: 400 }
        );
      }
      
      // Set the role from the database
      await setUserRoleClaim(uid, userData.role);
      
      // Get updated claims
      const claims = await getUserClaims(uid);
      
      return NextResponse.json({
        success: true,
        message: `Role claim set from database: ${userData.role}`,
        claims
      });
    }
    
    // If role was provided, set it directly
    await setUserRoleClaim(uid, role);
    
    // Get updated claims
    const claims = await getUserClaims(uid);
    
    return NextResponse.json({
      success: true,
      message: `Role claim set manually: ${role}`,
      claims
    });
  } catch (error: any) {
    console.error('Error setting role claim:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set role claim' },
      { status: 500 }
    );
  }
} 