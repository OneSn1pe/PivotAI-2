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
    
    // For middleware, we'll just do a basic check
    // The actual verification happens in the API routes
    return {
      valid: true
    };
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