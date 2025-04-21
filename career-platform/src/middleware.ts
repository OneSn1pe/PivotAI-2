import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Debug helper for tracing
const debug = {
  log: (...args: any[]) => console.log('[MIDDLEWARE]', ...args),
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  debug.log(`Processing ${request.method} request for ${path}`);

  // Define public paths that don't require authentication
  const isPublicPath = path === '/' || 
    path === '/auth/login' || 
    path === '/auth/register' ||
    path.startsWith('/_next') ||
    path.startsWith('/api');

  // Get the token from the session
  const token = request.cookies.get('session')?.value;

  // Redirect authenticated users away from auth pages
  if (isPublicPath && token) {
    debug.log(`Redirecting authenticated user from ${path} to dashboard`);
    return NextResponse.redirect(new URL('/protected/dashboard', request.url));
  }

  // Redirect unauthenticated users to login
  if (!isPublicPath && !token) {
    debug.log(`Redirecting unauthenticated user from ${path} to login`);
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Only run this middleware for API routes
  if (path.startsWith('/api/')) {
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
    debug.log(`Modifying response for ${request.method} request`);
    const response = NextResponse.next();
    
    // Add CORS headers to response
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Add marker for debugging
    response.headers.set('x-middleware-processed', 'true');
    
    return response;
  }

  debug.log(`Passing through request: ${request.method} ${path}`);
  return NextResponse.next();
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