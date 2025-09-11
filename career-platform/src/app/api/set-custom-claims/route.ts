import { NextResponse } from 'next/server';
import { getAdminServices } from '@/config/firebase-admin';
import logger from '@/utils/logger';

// Create namespaced logger
const log = logger.createNamespace('SetCustomClaimsAPI');

// API to set custom claims for a user
export async function POST(request: Request) {
  try {
    log.info('Setting custom claims request received');
    
    // Get Firebase Admin services
    const services = await getAdminServices();
    if (!services || !services.auth) {
      log.error('Firebase Admin services not available');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const { uid, customClaims } = await request.json();
    
    if (!uid) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    if (!customClaims || typeof customClaims !== 'object') {
      return NextResponse.json(
        { error: 'Custom claims must be a valid object' },
        { status: 400 }
      );
    }
    
    // Get current claims
    const user = await services.auth.getUser(uid);
    const currentClaims = user.customClaims || {};
    
    // Merge with new claims
    const newClaims = { ...currentClaims, ...customClaims };
    
    // Set the custom claims
    await services.auth.setCustomUserClaims(uid, newClaims);
    
    log.info(`Custom claims updated for user: ${uid}`, newClaims);
    
    return NextResponse.json({
      success: true,
      message: 'Custom claims updated successfully',
      claims: newClaims
    });
  } catch (error: any) {
    console.error('Error setting custom claims:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set custom claims' },
      { status: 500 }
    );
  }
} 