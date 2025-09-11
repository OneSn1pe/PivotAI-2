import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateTokenWithDetails, extractTokenFromRequest } from '@/utils/server-auth';
import { getAdminServices } from '@/config/firebase-admin';
import logger from '@/utils/logger';

// Create namespaced logger
const log = logger.createNamespace('VerifyTokenAPI');

// Mark as Node.js runtime to use Firebase Admin
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const start = Date.now();
  log.info('Token verification request received');
  
  // Extract token from multiple sources
  const sessionCookie = cookies().get('session')?.value || extractTokenFromRequest(request);
  
  // Response structure
  const response: {
    timestamp: string;
    tokenPresent: boolean;
    tokenLength: number;
    validationTime: number;
    validationSuccess: boolean;
    validationMethod: string;
    decodedToken: any;
    error: string | null;
    totalTime?: number;
    headers: {
      host: string | null;
      referer: string | null;
      userAgent: string | null;
    }
  } = {
    timestamp: new Date().toISOString(),
    tokenPresent: !!sessionCookie,
    tokenLength: sessionCookie?.length || 0,
    validationTime: 0,
    validationSuccess: false,
    validationMethod: '',
    decodedToken: null as any,
    error: null as string | null,
    headers: {
      host: request.headers.get('host'),
      referer: request.headers.get('referer'),
      userAgent: request.headers.get('user-agent')
    }
  };
  
  if (!sessionCookie) {
    response.error = 'No session cookie found';
    log.warn('Token verification failed: no token provided');
    return NextResponse.json(response, { status: 401 });
  }
  
  try {
    // Use enhanced token validation
    log.debug('Starting token validation');
    response.validationMethod = 'validateTokenWithDetails';
    const sessionStart = Date.now();
    
    const validationResult = await validateTokenWithDetails(sessionCookie);
    
    response.validationTime = Date.now() - sessionStart;
    response.validationSuccess = validationResult.valid;
    
    if (validationResult.valid && validationResult.decodedToken) {
      response.decodedToken = {
        uid: validationResult.decodedToken.uid,
        email: validationResult.decodedToken.email,
        role: validationResult.role,
        emailVerified: validationResult.decodedToken.email_verified,
        issuer: validationResult.decodedToken.iss,
        subject: validationResult.decodedToken.sub,
        audience: validationResult.decodedToken.aud,
        issuedAt: new Date(validationResult.decodedToken.iat * 1000).toISOString(),
        expiration: new Date(validationResult.decodedToken.exp * 1000).toISOString(),
        authTime: new Date(validationResult.decodedToken.auth_time * 1000).toISOString(),
      };
      log.info('Token validation successful', { uid: validationResult.uid, role: validationResult.role });
    } else {
      response.error = validationResult.error || 'Token validation failed';
      log.warn('Token validation failed', { reason: validationResult.reason, error: validationResult.error });
      return NextResponse.json(response, { status: 401 });
    }
    
    // Add total processing time
    response.totalTime = Date.now() - start;
    
    return NextResponse.json(response);
  } catch (error) {
    response.error = String(error);
    response.totalTime = Date.now() - start;
    log.error('Unexpected error during token verification:', error);
    return NextResponse.json(response, { status: 500 });
  }
} 