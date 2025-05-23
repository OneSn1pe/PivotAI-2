import { adminAuth, getFirebaseAdminApp } from '@/config/firebase-admin';

// Mark this file as server-only
export const runtime = 'nodejs';

export async function verifyToken(token: string) {
  try {
    // Get admin auth on demand to ensure it's initialized in serverless environment
    const services = getFirebaseAdminApp();
    if (!services || !services.auth) {
      throw new Error('Firebase Admin Auth not initialized');
    }
    
    const decodedToken = await services.auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying token:', error);
    throw new Error('Invalid token');
  }
}

export async function validateSession(sessionCookie: string) {
  try {
    // Get admin auth on demand to ensure it's initialized in serverless environment
    const services = getFirebaseAdminApp();
    if (!services || !services.auth) {
      console.error('[validateSession] Firebase Admin Auth not initialized');
      throw new Error('Firebase Admin Auth not initialized');
    }
    
    // Check for obviously invalid tokens (too short)
    if (!sessionCookie || sessionCookie.length < 100) {
      console.error('[validateSession] Token is too short to be valid:', sessionCookie?.length);
      throw new Error('Invalid token format: token too short');
    }
    
    // Verify the session cookie
    try {
      console.log('[validateSession] Attempting to verify session cookie');
      const decodedClaims = await services.auth.verifySessionCookie(sessionCookie, true);
      
      // Log the claims for debugging
      console.log('[validateSession] Session cookie verified successfully');
      console.log('[validateSession] User ID:', decodedClaims.uid);
      console.log('[validateSession] Role claim:', decodedClaims.role);
      
      // If role claim is missing, try to fetch from user record
      if (!decodedClaims.role) {
        console.log('[validateSession] No role claim found in token, fetching from user record');
        try {
          const userRecord = await services.auth.getUser(decodedClaims.uid);
          if (userRecord.customClaims?.role) {
            console.log('[validateSession] Found role in user record:', userRecord.customClaims.role);
            decodedClaims.role = userRecord.customClaims.role;
          } else {
            console.log('[validateSession] No role found in user record custom claims');
            
            // Try to get role from Firestore as a last resort
            try {
              const userDoc = await services.db.collection('users').doc(decodedClaims.uid).get();
              if (userDoc.exists && userDoc.data()?.role) {
                console.log('[validateSession] Found role in Firestore:', userDoc.data()?.role);
                decodedClaims.role = userDoc.data()?.role;
              } else {
                console.log('[validateSession] No role found in Firestore');
              }
            } catch (firestoreError) {
              console.error('[validateSession] Error fetching role from Firestore:', firestoreError);
            }
          }
        } catch (userError) {
          console.error('[validateSession] Error fetching user record:', userError);
        }
      }
      
      return decodedClaims;
    } catch (sessionError) {
      console.error('[validateSession] Session cookie verification failed:', sessionError);
      
      // Try verifying as ID token instead as a fallback
      try {
        console.log('[validateSession] Attempting to verify as ID token instead');
        const decodedToken = await services.auth.verifyIdToken(sessionCookie);
        
        // Log the claims for debugging
        console.log('[validateSession] ID token verified successfully');
        console.log('[validateSession] User ID:', decodedToken.uid);
        console.log('[validateSession] Role claim:', decodedToken.role);
        
        // If role claim is missing, try to fetch from user record
        if (!decodedToken.role) {
          console.log('[validateSession] No role claim found in token, fetching from user record');
          try {
            const userRecord = await services.auth.getUser(decodedToken.uid);
            if (userRecord.customClaims?.role) {
              console.log('[validateSession] Found role in user record:', userRecord.customClaims.role);
              decodedToken.role = userRecord.customClaims.role;
            } else {
              console.log('[validateSession] No role found in user record custom claims');
              
              // Try to get role from Firestore as a last resort
              try {
                const userDoc = await services.db.collection('users').doc(decodedToken.uid).get();
                if (userDoc.exists && userDoc.data()?.role) {
                  console.log('[validateSession] Found role in Firestore:', userDoc.data()?.role);
                  decodedToken.role = userDoc.data()?.role;
                } else {
                  console.log('[validateSession] No role found in Firestore');
                }
              } catch (firestoreError) {
                console.error('[validateSession] Error fetching role from Firestore:', firestoreError);
              }
            }
          } catch (userError) {
            console.error('[validateSession] Error fetching user record:', userError);
          }
        }
        
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