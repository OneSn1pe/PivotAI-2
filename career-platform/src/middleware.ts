import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

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
    return NextResponse.redirect(new URL('/protected/dashboard', request.url));
  }

  // Redirect unauthenticated users to login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

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