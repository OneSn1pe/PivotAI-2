import { NextResponse } from 'next/server';
import { getAdminServices } from '@/config/firebase-admin';
import logger from '@/utils/logger';

// Create namespaced logger
const log = logger.createNamespace('SetRoleClaimAPI');

// API to set role claim for a user
export async function POST(request: Request) {
  try {
    log.info('Setting role claim request received');
    
    // Get Firebase Admin services
    const services = await getAdminServices();
    if (!services) {
      log.error('Firebase Admin services not available');
      return NextResponse.json(
        { error: 'Server configuration error - Firebase Admin not initialized' },
        { status: 500 }
      );
    }

    const { auth: adminAuth, db: adminDb } = services;

    const { uid, role } = await request.json();
    
    if (!uid) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    if (!role) {
      // If role not provided, fetch from Firestore
      try {
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
        const user = await adminAuth.getUser(uid);
        const currentClaims = user.customClaims || {};
        
        await adminAuth.setCustomUserClaims(uid, {
          ...currentClaims,
          role: userData.role
        });
        
        return NextResponse.json({
          success: true,
          message: `Role claim set from database: ${userData.role}`,
          claims: { ...currentClaims, role: userData.role }
        });
      } catch (error: any) {
        console.error('Error fetching user role from Firestore:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to fetch user role' },
          { status: 500 }
        );
      }
    }
    
    // If role was provided, set it directly
    try {
      const user = await adminAuth.getUser(uid);
      const currentClaims = user.customClaims || {};
      
      await adminAuth.setCustomUserClaims(uid, {
        ...currentClaims,
        role
      });
      
      return NextResponse.json({
        success: true,
        message: `Role claim set manually: ${role}`,
        claims: { ...currentClaims, role }
      });
    } catch (error: any) {
      log.error('Error setting role claim:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to set role claim' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    log.error('Error in set-role-claim API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
} 