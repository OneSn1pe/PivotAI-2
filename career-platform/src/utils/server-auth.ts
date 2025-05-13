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
    
    // Verify the session cookie
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decodedClaims;
  } catch (error) {
    console.error('Error validating session:', error);
    throw new Error('Invalid session');
  }
} 