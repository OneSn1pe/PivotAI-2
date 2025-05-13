// Simple token verification for middleware
// This doesn't use Firebase Admin SDK to avoid Edge Runtime issues

export async function simpleTokenCheck(token: string) {
  try {
    // Just check if the token exists and has basic structure
    if (!token || token.length < 100) {
      throw new Error('Invalid token format');
    }
    
    // For middleware, we'll just do a basic check
    // The actual verification happens in the API routes
    return {
      valid: true
    };
  } catch (error) {
    console.error('Token check error:', error);
    return {
      valid: false
    };
  }
} 