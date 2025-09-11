import { getAdminServices } from '@/config/firebase-admin';
import { normalizeRole } from '@/utils/environment';
import { UserRole } from '@/types/user';
import logger from '@/utils/logger';
import * as admin from 'firebase-admin';

// Create namespaced logger
const log = logger.createNamespace('ServerAuth');

// Mark this file as server-only
export const runtime = 'nodejs';

export interface TokenValidationResult {
  valid: boolean;
  decodedToken?: admin.auth.DecodedIdToken;
  uid?: string;
  role?: string;
  error?: string;
  reason?: string;
}

export async function verifyToken(token: string) {
  try {
    // Get admin auth on demand to ensure it's initialized in serverless environment
    const services = await getAdminServices();
    if (!services || !services.auth) {
      log.error('Firebase Admin Auth not initialized');
      throw new Error('Firebase Admin Auth not initialized');
    }
    
    const decodedToken = await services.auth.verifyIdToken(token);
    log.debug(`Token verified for user: ${decodedToken.uid}`);
    return decodedToken;
  } catch (error) {
    log.error('Error verifying token:', error);
    throw new Error('Invalid token');
  }
}

export async function validateSession(sessionCookie: string): Promise<admin.auth.DecodedIdToken> {
  try {
    // Get admin auth on demand to ensure it's initialized in serverless environment
    const services = await getAdminServices();
    if (!services || !services.auth) {
      log.error('Firebase Admin Auth not initialized');
      throw new Error('Firebase Admin Auth not initialized');
    }
    
    // Check for obviously invalid tokens (too short)
    if (!sessionCookie || sessionCookie.length < 100) {
      log.error(`Token is too short to be valid: ${sessionCookie?.length} characters`);
      throw new Error('Invalid token format: token too short');
    }
    
    // Try ID token verification first (more common), then session cookie
    let decodedClaims;
    let verificationMethod = 'unknown';
    
    try {
      log.debug('Attempting to verify as ID token first');
      decodedClaims = await services.auth.verifyIdToken(sessionCookie, true);
      verificationMethod = 'id_token';
      log.info('ID token verified successfully', { uid: decodedClaims.uid, role: decodedClaims.role });
    } catch (idTokenError) {
      log.debug('ID token verification failed, trying session cookie');
      
      try {
        decodedClaims = await services.auth.verifySessionCookie(sessionCookie, true);
        verificationMethod = 'session_cookie';
        log.info('Session cookie verified successfully', { uid: decodedClaims.uid, role: decodedClaims.role });
      } catch (sessionError) {
        log.warn('Both ID token and session cookie verification failed', {
          idTokenError: idTokenError instanceof Error ? idTokenError.message : String(idTokenError),
          sessionError: sessionError instanceof Error ? sessionError.message : String(sessionError)
        });
        throw new Error('Invalid token: Failed both ID token and session cookie verification');
      }
    }
    
    // If role claim is missing, try to fetch from user record
    if (!decodedClaims.role) {
        log.info('No role claim found in token, fetching from user record');
        try {
          const userRecord = await services.auth.getUser(decodedClaims.uid);
          if (userRecord.customClaims?.role) {
            log.info('Found role in user record', { role: userRecord.customClaims.role });
            decodedClaims.role = userRecord.customClaims.role;
          } else {
            log.info('No role found in user record custom claims, checking Firestore');
            
            // Try to get role from Firestore as a last resort
            try {
              const userDoc = await services.db.collection('users').doc(decodedClaims.uid).get();
              if (userDoc.exists && userDoc.data()?.role) {
                log.info('Found role in Firestore', { role: userDoc.data()?.role });
                decodedClaims.role = userDoc.data()?.role;
              } else {
                log.warn('No role found in Firestore either');
              }
            } catch (firestoreError) {
              log.error('Error fetching role from Firestore:', firestoreError);
            }
          }
        } catch (userError) {
          log.error('Error fetching user record:', userError);
        }
      }
      
      // Normalize role for consistent comparison
      if (decodedClaims.role) {
        const normalizedRole = normalizeRole(decodedClaims.role as string);
        
        // Map normalized role back to enum value if it matches
        if (normalizedRole === normalizeRole(UserRole.RECRUITER)) {
          decodedClaims.role = UserRole.RECRUITER;
          console.log('[validateSession] Normalized recruiter role to:', decodedClaims.role);
        } else if (normalizedRole === normalizeRole(UserRole.CANDIDATE)) {
          decodedClaims.role = UserRole.CANDIDATE;
          console.log('[validateSession] Normalized candidate role to:', decodedClaims.role);
        }
      }
      
      return decodedClaims;
  } catch (error) {
    log.error('Error validating session:', error);
    throw new Error('Invalid session');
  }
}

/**
 * Enhanced token validation with comprehensive result object
 */
export async function validateTokenWithDetails(token: string): Promise<TokenValidationResult> {
  if (!token) {
    return {
      valid: false,
      error: 'No token provided',
      reason: 'MISSING_TOKEN'
    };
  }

  try {
    const decodedToken = await validateSession(token);
    return {
      valid: true,
      decodedToken,
      uid: decodedToken.uid,
      role: decodedToken.role as string,
      reason: 'VALID'
    };
  } catch (error) {
    log.error('Token validation failed:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      reason: 'VALIDATION_FAILED'
    };
  }
}

/**
 * Extract token from request headers or cookies
 */
export function extractTokenFromRequest(request: Request): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try cookie header
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string>);
    
    return cookies.session || null;
  }

  return null;
} 