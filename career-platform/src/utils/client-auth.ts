import logger from '@/utils/logger';

// Create namespaced logger
const log = logger.createNamespace('ClientAuth');

// Simple token verification for middleware
// This doesn't use Firebase Admin SDK to avoid Edge Runtime issues

export interface SimpleTokenResult {
  valid: boolean;
  reason: string;
  uid?: string;
  role?: string;
  expiredFor?: number;
}

export async function simpleTokenCheck(token: string): Promise<SimpleTokenResult> {
  try {
    // Just check if the token exists and has basic structure
    if (!token) {
      log.debug('Token is missing');
      return { 
        valid: false, 
        reason: 'Token missing'
      };
    }
    
    // Remove the overly permissive short token bypass
    // Now require proper JWT structure
    if (token.length < 100) {
      log.warn(`Token too short to be valid JWT: ${token.length} characters`);
      return { 
        valid: false, 
        reason: `Token too short (${token.length} chars) - must be valid JWT`
      };
    }
    
    // Restrict development bypass to localhost only and still validate JWT structure
    const isDevMode = typeof process !== 'undefined' && 
      (process.env.NODE_ENV === 'development' || 
       process.env.NEXT_PUBLIC_DEVELOPMENT_MODE === 'true');
    
    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    if (isDevMode && isLocalhost) {
      log.debug('Development mode on localhost: relaxed validation but still checking JWT structure');
      // Still validate JWT structure even in development
    } else if (isDevMode && !isLocalhost) {
      log.warn('Development mode detected but not on localhost - using strict validation');
    }
    
    // For production, perform basic JWT validation without requiring Firebase Admin
    try {
      // Basic structure validation for JWT
      const parts = token.split('.');
      if (parts.length !== 3) {
        log.warn('Invalid JWT structure - wrong number of parts');
        return { 
          valid: false, 
          reason: `Invalid JWT structure (${parts.length} parts instead of 3)` 
        };
      }
      
      // Decode the payload (middle part)
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      
      // Check for expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        const expiredFor = now - payload.exp;
        log.info(`Token expired ${expiredFor} seconds ago`);
        
        // Allow small grace period (2 minutes) for clock skew and network delays
        const gracePeriodSeconds = 120;
        if (expiredFor <= gracePeriodSeconds) {
          log.info('Token within grace period - allowing access');
          return {
            valid: true,
            reason: `Token expired ${expiredFor}s ago but within grace period`,
            uid: payload.user_id || payload.uid,
            role: payload.role || 'unknown',
            expiredFor
          };
        }
        
        return { 
          valid: false, 
          reason: `Token expired ${expiredFor} seconds ago (beyond grace period)`,
          expiredFor
        };
      }
      
      // Check for Firebase auth issuer
      if (!payload.iss || !payload.iss.includes('securetoken.google.com')) {
        log.warn('Invalid or missing token issuer');
        return { 
          valid: false, 
          reason: payload.iss ? `Invalid issuer: ${payload.iss}` : 'Missing issuer' 
        };
      }
      
      // Check for user_id claim
      if (!payload.user_id && !payload.uid) {
        log.warn('Token missing user identification claim');
        return {
          valid: false,
          reason: 'Missing user identification claim'
        };
      }
      
      // Use either user_id or uid (for compatibility)
      const userId = payload.user_id || payload.uid;
      
      // Warn if role claim is missing but don't fail validation
      // This ensures backward compatibility with existing tokens
      const userRole = payload.role || 'unknown';
      if (!payload.role) {
        log.warn(`Token missing role claim for user: ${userId}`);
      }
      
      // Additional security check: verify audience if present
      if (payload.aud && !payload.aud.includes(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '')) {
        log.warn('Token audience mismatch');
        // Don't fail on audience mismatch for now, just warn
      }
      
      log.debug('Basic token validation passed', { uid: userId, role: userRole });
      return { 
        valid: true, 
        uid: userId, 
        role: userRole,
        reason: 'Valid token'
      };
    } catch (parseError) {
      log.error('Error parsing token:', parseError);
      return { 
        valid: false, 
        reason: `Parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}` 
      };
    }
  } catch (error) {
    log.error('Token check error:', error);
    
    // Restricted development bypass - only for localhost and still require basic token structure
    const isDevMode = typeof process !== 'undefined' && 
        (process.env.NODE_ENV === 'development' || 
         process.env.NEXT_PUBLIC_DEVELOPMENT_MODE === 'true');
    
    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    if (isDevMode && isLocalhost && token && token.length > 100) {
      log.warn('Development mode on localhost - allowing access despite validation error');
      return { 
        valid: true, 
        reason: 'Development mode error bypass (localhost only)',
        uid: 'dev-user',
        role: 'candidate'
      };
    }
    
    return {
      valid: false,
      reason: `Error during validation: ${error instanceof Error ? error.message : String(error)}`
    };
  }
} 