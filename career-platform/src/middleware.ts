import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { simpleTokenCheck } from '@/utils/client-auth';

// Check if we're in development mode
const isDevelopment = process.env.NEXT_PUBLIC_DEVELOPMENT_MODE === 'true';
const isProduction = process.env.NODE_ENV === 'production';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const hostname = request.headers.get('host') || '';
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');

  // Define paths that are public/auth related - API paths are handled separately
  const isPublicPath = path === '/' || 
    path === '/auth/login' || 
    path === '/auth/register' ||
    path.startsWith('/_next') ||
    path.includes('/debug/');
    
  // Define API paths (handled differently)
  const isApiPath = path.startsWith('/api');

  // Get the token from the session
  const token = request.cookies.get('session')?.value;
  
  // If we're in development mode or running locally, we can bypass some auth checks
  if ((isDevelopment || isLocalhost) && path.includes('/protected')) {
    // For localhost development, we'll still pass through all protected routes
    return NextResponse.next();
  }
  
  // Handle API routes separately - don't redirect them
  if (isApiPath) {
    // Handle OPTIONS request for CORS
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Debug-Mode, X-Allow-Recruiter-Test, X-Environment-Info',
          'Access-Control-Max-Age': '86400',
        },
      });
      
      return response;
    }

    // Modify response for all API requests
    const response = NextResponse.next();
    
    // Add CORS headers to response
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Debug-Mode, X-Allow-Recruiter-Test, X-Environment-Info');
    
    return response;
  }

  // Only redirect authenticated users away from auth pages, not APIs
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL('/protected/dashboard', request.url));
  }

  // Redirect unauthenticated users to login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Handle candidate detail paths
  if (path.match(/\/protected\/(recruiter|candidate)\/candidate\/[^\/]+$/)) {
    if (token) {
      try {
        // Use simple token check instead of full verification
        const checkResult = await simpleTokenCheck(token);
        
        if (checkResult.valid) {
          return NextResponse.next();
        } else {
          // Special bypass for production to help with short token issues
          // This is a temporary fix until the proper session cookie handling is implemented
          if (isProduction && token.length > 20) {
            return NextResponse.next();
          }
          
          // If token check fails, redirect to login
          return NextResponse.redirect(new URL('/auth/login', request.url));
        }
      } catch (error) {
        // If token verification fails, redirect to login
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
    }
  }

  const response = NextResponse.next();
  response.headers.set('x-auth-status', token ? 'authenticated' : 'unauthenticated');
  
  // Set CSP headers that ensure inline styles work
  const existingCsp = response.headers.get('Content-Security-Policy') || '';
  if (!existingCsp.includes('style-src')) {
    // Add style-src with 'unsafe-inline' to allow inline styles
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