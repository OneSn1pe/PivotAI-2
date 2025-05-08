import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Debug helper for tracing
const debug = {
  log: (...args: any[]) => console.log('[MIDDLEWARE]', ...args),
  error: (...args: any[]) => console.error('[MIDDLEWARE]', ...args),
  warn: (...args: any[]) => console.warn('[MIDDLEWARE]', ...args),
  info: (...args: any[]) => console.info('[MIDDLEWARE]', ...args),
};

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const referrer = request.headers.get('referer') || 'unknown';
  debug.log(`Processing ${request.method} request for ${path}`, { referrer });

  // Define paths that are public/auth related - API paths are handled separately
  const isPublicPath = path === '/' || 
    path === '/auth/login' || 
    path === '/auth/register' ||
    path.startsWith('/_next');
    
  // Define API paths (handled differently)
  const isApiPath = path.startsWith('/api');
  
  // Check for internal navigation between protected routes
  const isProtectedPath = path.startsWith('/protected');
  const isFromProtectedPath = referrer.includes('/protected');
  
  // Check if this is a request to Firebase/Firestore
  const isFirestoreRequest = 
    path.includes('firestore.googleapis.com') || 
    referrer.includes('firestore.googleapis.com') ||
    request.headers.get('origin')?.includes('firestore.googleapis.com');
  
  // Get the token from the session
  const token = request.cookies.get('session')?.value;
  
  debug.info('Request details', {
    path,
    referrer,
    isPublicPath,
    isApiPath,
    isProtectedPath,
    isFromProtectedPath,
    isFirestoreRequest,
    hasToken: !!token,
    tokenLength: token?.length
  });

  // Add CORS headers for all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };

  // Special handling for Firestore requests and OPTIONS requests
  if (isFirestoreRequest || request.method === 'OPTIONS') {
    debug.log('Processing Firestore or OPTIONS request');
    
    const response = new NextResponse(
      request.method === 'OPTIONS' ? null : undefined,
      {
        status: request.method === 'OPTIONS' ? 204 : undefined,
        headers: corsHeaders,
      }
    );
    
    // Add debug markers
    response.headers.set('x-middleware-processed', 'true');
    response.headers.set('x-firestore-request', String(isFirestoreRequest));
    
    return response;
  }

  // Handle API routes with CORS headers
  if (isApiPath) {
    debug.log(`Processing API route: ${request.method} ${path}`);
    const response = NextResponse.next();
    
    // Add CORS headers to all API responses
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    // Add marker for debugging
    response.headers.set('x-middleware-processed', 'true');
    
    return response;
  }

  // Only redirect authenticated users away from auth pages, not APIs
  if (isPublicPath && token) {
    debug.log(`Redirecting authenticated user from ${path} to dashboard`);
    return NextResponse.redirect(new URL('/protected/dashboard', request.url));
  }

  // Special case: internal navigation between protected routes
  // This helps prevent auth issues during navigation, especially candidate profile viewing
  if (isProtectedPath && isFromProtectedPath) {
    // If it's internal protected navigation, be more lenient
    debug.info('Internal protected navigation detected', { from: referrer, to: path });
    
    // Special case for candidate profile viewing from interested page
    if (path.includes('/protected/recruiter/candidate/') && 
        (referrer.includes('/protected/recruiter/interested') || 
         referrer.includes('/protected/recruiter/search') ||
         referrer.includes('/protected/recruiter/dashboard'))) {
      debug.info('Candidate profile access from recruiter pages - allowing navigation');
      
      const response = NextResponse.next();
      // Add debugging headers
      response.headers.set('x-debug-navigation', 'internal-protected');
      response.headers.set('x-debug-from', referrer);
      response.headers.set('x-debug-to', path);
      
      // Ensure we pass through CORS headers
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;
    }
    
    // For other internal protected navigation with no token, log but still allow
    if (!token) {
      debug.warn('Internal protected navigation with no token - monitoring', { 
        from: referrer, 
        to: path 
      });
      
      const response = NextResponse.next();
      response.headers.set('x-debug-auth-warning', 'missing-token-internal-nav');
      // Also add CORS headers
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }
    
    // Otherwise just proceed normally for internal protected navigation
    const response = NextResponse.next();
    // Add CORS headers to all responses
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // Redirect unauthenticated users to login for protected paths
  if (isProtectedPath && !token) {
    debug.warn(`Redirecting unauthenticated user from ${path} to login`, { referrer });
    
    // Store the attempted URL to redirect back after login
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('callbackUrl', path);
    
    return NextResponse.redirect(redirectUrl);
  }

  debug.log(`Passing through request: ${request.method} ${path}`);
  // Add CORS headers to the default response too
  const response = NextResponse.next();
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
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