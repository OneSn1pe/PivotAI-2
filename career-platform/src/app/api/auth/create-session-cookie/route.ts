import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '@/config/firebase-admin';
import { extractTokenFromRequest } from '@/utils/server-auth';
import logger from '@/utils/logger';

const log = logger.createNamespace('CreateSessionCookieAPI');

export async function POST(request: NextRequest) {
  try {
    log.info('Create session cookie request received');

    // Get Firebase Admin services
    const services = await getAdminServices();
    if (!services) {
      log.error('Firebase Admin services not available');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Extract ID token from request
    const { idToken } = await request.json();
    
    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }

    // Verify the ID token first
    const decodedToken = await services.auth.verifyIdToken(idToken);
    log.info('ID token verified for session cookie creation', { uid: decodedToken.uid });

    // Create session cookie (expires in 1 hour)
    const expiresIn = 60 * 60 * 1000; // 1 hour in milliseconds
    const sessionCookie = await services.auth.createSessionCookie(idToken, { expiresIn });

    log.info('Session cookie created successfully');

    // Set the session cookie in the response
    const response = NextResponse.json({
      success: true,
      message: 'Session cookie created'
    });

    // Set the cookie with proper security settings
    const isProduction = process.env.NODE_ENV === 'production';
    response.cookies.set('session', sessionCookie, {
      maxAge: 3600, // 1 hour
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/',
    });

    return response;

  } catch (error) {
    log.error('Error creating session cookie:', error);
    
    // Check for specific Firebase errors
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        return NextResponse.json(
          { error: 'ID token expired, please log in again' },
          { status: 401 }
        );
      }
      if (error.message.includes('invalid')) {
        return NextResponse.json(
          { error: 'Invalid ID token' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to create session cookie',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}