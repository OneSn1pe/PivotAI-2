import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { simpleTokenCheck } from '@/utils/client-auth';

// Check if we're in development mode
const isDevelopment = process.env.NEXT_PUBLIC_DEVELOPMENT_MODE === 'true';

// Debug helper for tracing
const debug = {
  log: (...args: any[]) => console.log('[MIDDLEWARE]', ...args),
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
        const checkResult = await simpleTokenCheck(token);
        
        if (checkResult.valid) {
          // Allow access - detailed verification happens in API
          debug.log(`Access granted to candidate detail path`);
          return NextResponse.next();
        } else {
          // If token check fails, redirect to login
          return NextResponse.redirect(new URL('/auth/login', request.url));
        }
      } catch (error) {
        debug.log(`Error checking token: ${error}`);
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