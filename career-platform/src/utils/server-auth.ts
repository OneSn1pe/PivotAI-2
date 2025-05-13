import { adminAuth } from '@/config/firebase-admin';

// Mark this file as server-only
export const runtime = 'nodejs';

export async function verifyToken(token: string) {
  try {
    if (!adminAuth) {
      throw new Error('Firebase Admin Auth not initialized');
    }
    
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying token:', error);
    throw new Error('Invalid token');
  }
}

export async function validateSession(sessionCookie: string) {
  try {
    if (!adminAuth) {
      throw new Error('Firebase Admin Auth not initialized');
    }
    
    // Check for obviously invalid tokens (too short)
    if (!sessionCookie || sessionCookie.length < 100) {
      console.error('[validateSession] Token is too short to be valid:', sessionCookie?.length);
      throw new Error('Invalid token format: token too short');
    }
    
    // Verify the session cookie
    try {
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
      return decodedClaims;
    } catch (sessionError) {
      console.error('[validateSession] Session cookie verification failed:', sessionError);
      
      // Try verifying as ID token instead as a fallback
      try {
        console.log('[validateSession] Attempting to verify as ID token instead');
        const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
        return decodedToken;
      } catch (idTokenError) {
        console.error('[validateSession] ID token verification also failed:', idTokenError);
        throw new Error('Invalid session: Failed both session cookie and ID token verification');
      }
    }
  } catch (error) {
    console.error('Error validating session:', error);
    throw new Error('Invalid session');
  }
} 