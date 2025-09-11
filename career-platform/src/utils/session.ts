import { NextResponse } from 'next/server';

interface CookieOptions {
  maxAge?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  path?: string;
}

export class SessionManager {
  private static readonly SESSION_COOKIE_NAME = 'session';
  private static readonly DEFAULT_MAX_AGE = 3600; // 1 hour
  
  static setSessionCookie(
    token: string,
    options: CookieOptions = {},
    response?: NextResponse
  ): boolean {
    if (typeof window === 'undefined' && !response) {
      console.error('Response object required for server-side cookie setting');
      return false;
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    const cookieOptions = {
      maxAge: options.maxAge || this.DEFAULT_MAX_AGE,
      path: options.path || '/',
      httpOnly: options.httpOnly ?? false, // Set to false for client-side access
      secure: options.secure ?? (isProduction && !isLocalhost),
      sameSite: options.sameSite || (isProduction && !isLocalhost ? 'strict' : 'lax')
    };

    const cookieString = [
      `${this.SESSION_COOKIE_NAME}=${token}`,
      `Path=${cookieOptions.path}`,
      `Max-Age=${cookieOptions.maxAge}`,
      cookieOptions.httpOnly ? 'HttpOnly' : '',
      cookieOptions.secure ? 'Secure' : '',
      `SameSite=${cookieOptions.sameSite}`
    ].filter(Boolean).join('; ');

    try {
      if (typeof window !== 'undefined') {
        // Client-side: Store ID token directly (Firebase Admin handles both)
        document.cookie = cookieString;
        console.log('[SessionManager] Set ID token as session cookie');
      } else if (response) {
        // Server-side
        response.cookies.set(this.SESSION_COOKIE_NAME, token, cookieOptions);
      }
      
      return true;
    } catch (error) {
      console.error('[SessionManager] Error setting cookie:', error);
      return false;
    }
  }

  static getSessionCookie(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const cookies = document.cookie.split(';');
    const sessionCookie = cookies.find(cookie => 
      cookie.trim().startsWith(`${this.SESSION_COOKIE_NAME}=`)
    );

    return sessionCookie ? sessionCookie.split('=')[1] : null;
  }

  static clearSessionCookie(response?: NextResponse): boolean {
    const clearOptions = {
      maxAge: 0,
      path: '/'
    };

    try {
      if (typeof window !== 'undefined') {
        document.cookie = `${this.SESSION_COOKIE_NAME}=; Path=/; Max-Age=0`;
      } else if (response) {
        response.cookies.delete(this.SESSION_COOKIE_NAME);
      }
      
      console.log('[SessionManager] Cleared session cookie');
      return true;
    } catch (error) {
      console.error('[SessionManager] Error clearing cookie:', error);
      return false;
    }
  }

  static async refreshSessionCookie(user: any): Promise<boolean> {
    try {
      const token = await user.getIdToken(true);
      return this.setSessionCookie(token);
    } catch (error) {
      console.error('[SessionManager] Error refreshing session cookie:', error);
      return false;
    }
  }
}