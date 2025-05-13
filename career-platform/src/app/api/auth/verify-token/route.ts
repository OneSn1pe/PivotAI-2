import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateSession } from '@/utils/server-auth';
import { adminAuth } from '@/config/firebase-admin';

// Mark as Node.js runtime to use Firebase Admin
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const start = Date.now();
  const sessionCookie = cookies().get('session')?.value;
  
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
    return NextResponse.json(response, { status: 401 });
  }
  
  try {
    // First try validateSession (uses verifySessionCookie)
    try {
      console.log('[verify-token] Attempting to validate with verifySessionCookie');
      response.validationMethod = 'verifySessionCookie';
      const sessionStart = Date.now();
      
      const decodedClaims = await validateSession(sessionCookie);
      
      response.validationTime = Date.now() - sessionStart;
      response.validationSuccess = true;
      response.decodedToken = {
        uid: decodedClaims.uid,
        email: decodedClaims.email,
        role: decodedClaims.role,
        emailVerified: decodedClaims.email_verified,
        issuer: decodedClaims.iss,
        subject: decodedClaims.sub,
        audience: decodedClaims.aud,
        issuedAt: new Date(decodedClaims.iat * 1000).toISOString(),
        expiration: new Date(decodedClaims.exp * 1000).toISOString(),
        authTime: new Date(decodedClaims.auth_time * 1000).toISOString(),
      };
    } catch (sessionError) {
      console.log('[verify-token] Session cookie validation failed, trying ID token verification');
      
      // If session validation fails, try verifyIdToken as fallback
      try {
        response.validationMethod = 'verifyIdToken';
        const idTokenStart = Date.now();
        
        if (!adminAuth) {
          throw new Error('Firebase Admin Auth not initialized');
        }
        
        const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
        
        response.validationTime = Date.now() - idTokenStart;
        response.validationSuccess = true;
        response.decodedToken = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          role: decodedToken.role,
          emailVerified: decodedToken.email_verified,
          issuer: decodedToken.iss,
          subject: decodedToken.sub,
          audience: decodedToken.aud,
          issuedAt: new Date(decodedToken.iat * 1000).toISOString(),
          expiration: new Date(decodedToken.exp * 1000).toISOString(),
          authTime: new Date(decodedToken.auth_time * 1000).toISOString(),
        };
      } catch (idTokenError) {
        // Both methods failed
        response.error = `Session validation failed: ${sessionError}. ID token validation failed: ${idTokenError}`;
        return NextResponse.json(response, { status: 401 });
      }
    }
    
    // Add total processing time
    response.totalTime = Date.now() - start;
    
    return NextResponse.json(response);
  } catch (error) {
    response.error = String(error);
    response.totalTime = Date.now() - start;
    return NextResponse.json(response, { status: 500 });
  }
} 