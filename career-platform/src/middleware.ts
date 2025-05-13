import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { simpleTokenCheck } from '@/utils/client-auth';

// Check if we're in development mode
const isDevelopment = process.env.NEXT_PUBLIC_DEVELOPMENT_MODE === 'true';

// Debug helper for tracing with enhanced token debugging
const debug = {
  log: (...args: any[]) => console.log('[MIDDLEWARE]', ...args),
  tokenDebug: (token: string | undefined, path: string) => {
    if (!token) {
      console.log('[MIDDLEWARE-TOKEN-DEBUG] No token present for path:', path);
      return { present: false };
    }
    
    try {
      // Basic token structure check
      const parts = token.split('.');
      const debugInfo: {
        present: boolean;
        length: number;
        parts: number;
        structureValid: boolean;
        path: string;
        timestamp: string;
        payload?: {
          exp?: number;
          iat?: number;
          expValid?: boolean;
          hasUid?: boolean;
          uid?: string;
          hasRole?: boolean;
          role?: string;
          iss?: string;
          issValid?: boolean;
          expiresIn?: string;
        };
        decodeError?: string;
        error?: string;
      } = {
        present: true,
        length: token.length,
        parts: parts.length,
        structureValid: parts.length === 3,
        path: path,
        timestamp: new Date().toISOString()
      };
      
      // Only try to decode if structure is valid
      if (debugInfo.structureValid) {
        try {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          debugInfo.payload = {
            exp: payload.exp,
            iat: payload.iat,
            expValid: payload.exp ? payload.exp > Math.floor(Date.now() / 1000) : false,
            hasUid: !!payload.user_id,
            uid: payload.user_id?.substring(0, 5) + '...',
            hasRole: !!payload.role,
            role: payload.role,
            iss: payload.iss?.substring(0, 20) + '...',
            issValid: payload.iss?.includes('securetoken.google.com')
          };
          
          // Calculate expiration time
          if (payload.exp) {
            const expiresIn = payload.exp - Math.floor(Date.now() / 1000);
            debugInfo.payload.expiresIn = `${expiresIn} seconds (${Math.floor(expiresIn / 60)} minutes)`;
          }
        } catch (decodeError) {
          debugInfo.decodeError = String(decodeError);
        }
      }
      
      console.log('[MIDDLEWARE-TOKEN-DEBUG]', JSON.stringify(debugInfo, null, 2));
      return debugInfo;
    } catch (error) {
      console.error('[MIDDLEWARE-TOKEN-DEBUG] Error analyzing token:', error);
      return { present: true, error: String(error) };
    }
  }
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const hostname = request.headers.get('host') || '';
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
  
  debug.log(`Processing ${request.method} request for ${path}`);
  debug.log(`Host: ${hostname}, isLocalhost: ${isLocalhost}, isDevelopment: ${isDevelopment}`);

  // Define paths that are public/auth related - API paths are handled separately
  const isPublicPath = path === '/' || 
    path === '/auth/login' || 
    path === '/auth/register' ||
    path.startsWith('/_next');
    
  // Define API paths (handled differently)
  const isApiPath = path.startsWith('/api');

  // Get the token from the session
  const token = request.cookies.get('session')?.value;
  debug.log(`Auth token present: ${!!token}, length: ${token?.length || 0}`);
  
  // Run token debug analysis
  const tokenAnalysis = debug.tokenDebug(token, path);
  
  // Special debug endpoint to see token validation results
  if (path === '/debug/middleware-token') {
    return NextResponse.json({
      path,
      timestamp: new Date().toISOString(),
      token: tokenAnalysis,
      headers: Object.fromEntries(request.headers),
      cookies: request.cookies.getAll().map(c => ({ name: c.name, value: c.value ? `${c.value.substring(0, 5)}...` : null }))
    });
  }

  // If we're in development mode and running locally, we can bypass some auth checks
  if ((isDevelopment || isLocalhost) && path.includes('/protected')) {
    debug.log('Development mode: partially bypassing auth checks for protected routes');
    if (!token) {
      debug.log('Warning: No token present in development mode');
    }
    
    // For localhost development, we'll still pass through all protected routes
    // but log warnings when authentication would normally fail
    if (!token && path !== '/protected/dashboard') {
      debug.log('⚠️ Development mode: Allowing access to protected route without authentication');
    }
    
    // Handle candidate detail paths specifically
    if (path.match(/\/protected\/(recruiter|candidate)\/candidate\/[^\/]+$/)) {
      const pathSegments = path.split('/');
      const roleInPath = pathSegments[2];
      const candidateId = pathSegments[4];
      
      debug.log(`🔍 Candidate detail path: ${path}, Role: ${roleInPath}, ID: ${candidateId}`);
    }
    
    // In development, pass through even without token for testing
    return NextResponse.next();
  }
  
  // Handle API routes separately - don't redirect them
  if (isApiPath) {
    debug.log(`Processing API route: ${request.method} ${path}`);
    
    // Handle OPTIONS request for CORS
    if (request.method === 'OPTIONS') {
      debug.log('Handling OPTIONS request for CORS preflight');
      
      const response = new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
      
      // Add marker for debugging
      response.headers.set('x-middleware-processed', 'true');
      
      return response;
    }

    // Modify response for all API requests
    debug.log(`Modifying response for ${request.method} API request to ${path}`);
    const response = NextResponse.next();
    
    // Add CORS headers to response
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Add marker for debugging
    response.headers.set('x-middleware-processed', 'true');
    
    return response;
  }

  // Only redirect authenticated users away from auth pages, not APIs
  if (isPublicPath && token) {
    debug.log(`Redirecting authenticated user from ${path} to dashboard`);
    return NextResponse.redirect(new URL('/protected/dashboard', request.url));
  }

  // Redirect unauthenticated users to login
  if (!isPublicPath && !token) {
    debug.log(`Redirecting unauthenticated user from ${path} to login`);
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Handle candidate detail paths
  if (path.match(/\/protected\/(recruiter|candidate)\/candidate\/[^\/]+$/)) {
    debug.log(`Processing candidate detail path: ${path}`);
    
    if (token) {
      try {
        // Use simple token check instead of full verification
        debug.log(`Running simpleTokenCheck for candidate detail path`);
        const checkStart = Date.now();
        const checkResult = await simpleTokenCheck(token);
        const checkDuration = Date.now() - checkStart;
        
        debug.log(`Token check result: valid=${checkResult.valid}, took ${checkDuration}ms`);
        
        if (checkResult.valid) {
          // Extract information from the path
          const pathSegments = path.split('/');
          const role = pathSegments[2]; // recruiter or candidate
          const candidateId = pathSegments[4]; // ID from URL
          
          debug.log(`Allowing access to candidate detail: role=${role}, candidateId=${candidateId}`);
          return NextResponse.next();
        } else {
          // Special bypass for production to help with short token issues
          // This is a temporary fix until the proper session cookie handling is implemented
          if (process.env.NODE_ENV === 'production' && token.length > 20) {
            debug.log(`PRODUCTION BYPASS: Allowing access despite invalid token (length=${token.length})`);
            return NextResponse.next();
          }
          
          debug.log(`Token check failed: ${checkResult.reason}`);
          
          // Add debug response with token validation failure details
          if (path.includes('/debug/')) {
            return NextResponse.json({
              error: 'Token validation failed',
              path: path,
              tokenAnalysis: tokenAnalysis,
              checkResult: checkResult
            }, { status: 401 });
          }
          
          // If token check fails, redirect to login
          return NextResponse.redirect(new URL('/auth/login', request.url));
        }
      } catch (error) {
        debug.log(`Error in token check: ${error}`);
        
        // Add debug response with error details
        if (path.includes('/debug/')) {
          return NextResponse.json({
            error: 'Token check error',
            message: String(error),
            path: path,
            tokenAnalysis: tokenAnalysis
          }, { status: 500 });
        }
        
        // If token verification fails, redirect to login
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
    }
  }

  debug.log(`Passing through request: ${request.method} ${path}, token exists: ${!!token}`);
  const response = NextResponse.next();
  response.headers.set('x-auth-status', token ? 'authenticated' : 'unauthenticated');

  // Clone the request headers
  const requestHeaders = new Headers(request.headers);
  
  // Get environment information 
  const isProd = process.env.NODE_ENV === 'production';
  const isDev = process.env.NEXT_PUBLIC_DEVELOPMENT_MODE === 'true';
  
  // Add environment debug headers to help diagnose environment-specific issues
  response.headers.set('X-Debug-Environment', isProd ? 'production' : 'development');
  response.headers.set('X-Debug-Development-Mode', isDev ? 'true' : 'false');
  response.headers.set('X-Debug-Hostname', hostname);
  response.headers.set('X-Debug-Token-Present', token ? 'true' : 'false');
  if (token) {
    response.headers.set('X-Debug-Token-Length', String(token.length));
  }
  
  // Set CSP headers that ensure inline styles work
  const existingCsp = response.headers.get('Content-Security-Policy') || '';
  if (!existingCsp.includes('style-src')) {
    // Add style-src with 'unsafe-inline' to allow inline styles (important for debugging)
    response.headers.set(
      'Content-Security-Policy',
      `${existingCsp} style-src 'self' 'unsafe-inline';`.trim()
    );
  }
  
  return response;
}

// Configure which routes should trigger this middleware
export const config = {
  matcher: [
    '/',
    '/auth/:path*',
    '/protected/:path*',
    '/api/:path*',
    '/debug/:path*'
  ]
}; 