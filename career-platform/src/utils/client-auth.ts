// Simple token verification for middleware
// This doesn't use Firebase Admin SDK to avoid Edge Runtime issues

export async function simpleTokenCheck(token: string) {
  try {
    // Just check if the token exists and has basic structure
    if (!token || token.length < 100) {
      console.log('[simpleTokenCheck] Token is missing or too short');
      throw new Error('Invalid token format');
    }
    
    // In development mode, always return valid to avoid issues
    if (typeof process !== 'undefined' && 
        (process.env.NODE_ENV === 'development' || 
         process.env.NEXT_PUBLIC_DEVELOPMENT_MODE === 'true')) {
      console.log('[simpleTokenCheck] Development mode - bypassing token verification');
      return { valid: true };
    }
    
    // For production, perform basic JWT validation without requiring Firebase Admin
    try {
      // Basic structure validation for JWT
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.log('[simpleTokenCheck] Invalid token structure (not a JWT)');
        return { valid: false };
      }
      
      // Decode the payload (middle part)
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      
      // Check for expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        console.log('[simpleTokenCheck] Token expired');
        return { valid: false };
      }
      
      // Check for Firebase auth issuer
      if (!payload.iss || !payload.iss.includes('securetoken.google.com')) {
        console.log('[simpleTokenCheck] Invalid token issuer');
        return { valid: false };
      }
      
      console.log('[simpleTokenCheck] Basic token validation passed');
      return { valid: true, uid: payload.user_id, role: payload.role };
    } catch (parseError) {
      console.error('[simpleTokenCheck] Error parsing token:', parseError);
      return { valid: false };
    }
  } catch (error) {
    console.error('[simpleTokenCheck] Token check error:', error);
    
    // In development, return valid anyway to allow testing
    if (typeof process !== 'undefined' && 
        (process.env.NODE_ENV === 'development' || 
         process.env.NEXT_PUBLIC_DEVELOPMENT_MODE === 'true')) {
      console.log('[simpleTokenCheck] Development mode - allowing access despite error');
      return { valid: true };
    }
    
    return {
      valid: false
    };
  }
} 