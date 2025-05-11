import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Check if we're in development mode
const isDevelopment = process.env.NEXT_PUBLIC_DEVELOPMENT_MODE === 'true';

// Debug helper for tracing
const debug = {
  log: (...args: any[]) => console.log('[MIDDLEWARE]', ...args),
}

export function middleware(request: NextRequest) {
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
  debug.log(`Cookie names: ${Array.from(request.cookies.getAll()).map(c => c.name).join(', ')}`);
  
  // If we're in development mode and running locally, we can bypass some auth checks
  if ((isDevelopment || isLocalhost) && path.includes('/protected')) {
    debug.log('Development mode: partially bypassing auth checks for protected routes');
    // Still log the token status but don't redirect to login
    if (!token) {
      debug.log('Warning: No token present in development mode');
    }
    // For localhost development, we'll still pass through all protected routes
    // but log warnings when authentication would normally fail
    if (!token && path !== '/protected/dashboard') {
      debug.log('⚠️ Development mode: Allowing access to protected route without authentication');
    }
    
    // For candidate paths specifically, we need special handling
    if (path.includes('/recruiter/candidate/')) {
      debug.log(`🔍 RECRUITER PATH in development: ${path}, Token present: ${!!token}`);
    }
    
    // In development, pass through even without token for testing
    return NextResponse.next();
  }
  
  // Debug the recruiter path specifically
  if (path.includes('/recruiter/candidate/')) {
    debug.log(`🔍 RECRUITER PATH: ${path}, Token present: ${!!token}`);
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

  debug.log(`Passing through request: ${request.method} ${path}, token exists: ${!!token}`);
  const response = NextResponse.next();
  response.headers.set('x-auth-status', token ? 'authenticated' : 'unauthenticated');
  return response;
}

// Configure which routes should trigger this middleware
export const config = {
  matcher: [
    '/',
    '/auth/:path*',
    '/protected/:path*',
    '/api/:path*'
  ]
}; 