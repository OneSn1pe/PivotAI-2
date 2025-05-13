// Simple token verification for middleware
// This doesn't use Firebase Admin SDK to avoid Edge Runtime issues

export async function simpleTokenCheck(token: string) {
  try {
    // Just check if the token exists and has basic structure
    if (!token || token.length < 100) {
      console.log('[simpleTokenCheck] Token is missing or too short');
      return { 
        valid: false, 
        reason: token ? `Token too short (${token.length} chars)` : 'Token missing'
      };
    }
    
    // In development mode, always return valid to avoid issues
    if (typeof process !== 'undefined' && 
        (process.env.NODE_ENV === 'development' || 
         process.env.NEXT_PUBLIC_DEVELOPMENT_MODE === 'true')) {
      console.log('[simpleTokenCheck] Development mode - bypassing token verification');
      return { valid: true, reason: 'Development mode bypass' };
    }
    
    // For production, perform basic JWT validation without requiring Firebase Admin
    try {
      // Basic structure validation for JWT
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.log('[simpleTokenCheck] Invalid token structure (not a JWT)');
        return { 
          valid: false, 
          reason: `Invalid token structure (${parts.length} parts instead of 3)` 
        };
      }
      
      // Decode the payload (middle part)
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      
      // Check for expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        console.log('[simpleTokenCheck] Token expired');
        const expiredFor = now - payload.exp;
        return { 
          valid: false, 
          reason: `Token expired ${expiredFor} seconds ago`,
          expiredFor
        };
      }
      
      // Check for Firebase auth issuer
      if (!payload.iss || !payload.iss.includes('securetoken.google.com')) {
        console.log('[simpleTokenCheck] Invalid token issuer');
        return { 
          valid: false, 
          reason: payload.iss ? `Invalid issuer: ${payload.iss}` : 'Missing issuer' 
        };
      }
      
      // Check for user_id claim
      if (!payload.user_id && !payload.uid) {
        console.log('[simpleTokenCheck] Missing user_id/uid claim');
        return {
          valid: false,
          reason: 'Missing user identification claim'
        };
      }
      
      // Use either user_id or uid (for compatibility)
      const userId = payload.user_id || payload.uid;
      
      // Check for role claim - but don't invalidate if missing
      // This ensures backward compatibility with existing tokens
      if (!payload.role) {
        console.log('[simpleTokenCheck] Warning: Missing role claim - allowing access anyway');
      }
      
      console.log('[simpleTokenCheck] Basic token validation passed');
      return { 
        valid: true, 
        uid: userId, 
        role: payload.role || 'unknown', // Default role if missing
        exp: payload.exp,
        iat: payload.iat
      };
    } catch (parseError) {
      console.error('[simpleTokenCheck] Error parsing token:', parseError);
      return { 
        valid: false, 
        reason: `Parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}` 
      };
    }
  } catch (error) {
    console.error('[simpleTokenCheck] Token check error:', error);
    
    // In development, return valid anyway to allow testing
    if (typeof process !== 'undefined' && 
        (process.env.NODE_ENV === 'development' || 
         process.env.NEXT_PUBLIC_DEVELOPMENT_MODE === 'true')) {
      console.log('[simpleTokenCheck] Development mode - allowing access despite error');
      return { valid: true, reason: 'Development mode error bypass' };
    }
    
    return {
      valid: false,
      reason: `Error during validation: ${error instanceof Error ? error.message : String(error)}`
    };
  }
} 