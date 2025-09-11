import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { simpleTokenCheck } from '@/utils/client-auth';
import type { SimpleTokenResult } from '@/utils/client-auth';

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
  
  // Restrict development bypasses - only for localhost and still require token
  if (isDevelopment && isLocalhost && path.includes('/protected')) {
    // Even in development, require a token to be present
    if (!token) {
      console.log('[Middleware] Development mode: redirecting to login due to missing token');
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    console.log('[Middleware] Development mode on localhost: allowing access but token is present');
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

  // Handle all protected paths with proper token validation
  if (path.startsWith('/protected')) {
    if (token) {
      try {
        // Use improved token validation
        const checkResult: SimpleTokenResult = await simpleTokenCheck(token);
        
        if (checkResult.valid) {
          console.log(`[Middleware] Token validated for protected path: ${path}`);
          return NextResponse.next();
        } else {
          console.log(`[Middleware] Token validation failed: ${checkResult.reason}`);
          
          // Remove the overly permissive production bypass
          // All invalid tokens should redirect to login
          return NextResponse.redirect(new URL('/auth/login', request.url));
        }
      } catch (error) {
        console.error('[Middleware] Token validation error:', error);
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
    } else {
      console.log('[Middleware] No token found for protected path, redirecting to login');
      return NextResponse.redirect(new URL('/auth/login', request.url));
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