import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Define a proper type for the token object
interface TokenInfo {
  present: boolean;
  length: number;
  structureValid: boolean;
  parts: number;
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
    claims?: string[];
  };
  decodeError?: string;
}

export async function GET() {
  const sessionCookie = cookies().get('session')?.value;
  
  // Basic token structure check
  let token: TokenInfo = {
    present: !!sessionCookie,
    length: sessionCookie?.length || 0,
    structureValid: false,
    parts: 0,
    path: '/debug/middleware-token',
    timestamp: new Date().toISOString()
  };
  
  if (sessionCookie) {
    try {
      // Check JWT structure (header.payload.signature)
      const parts = sessionCookie.split('.');
      token.parts = parts.length;
      token.structureValid = parts.length === 3;
      
      // Try to decode the payload
      if (token.structureValid) {
        try {
          const base64Url = parts[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          
          const payload = JSON.parse(jsonPayload);
          
          // Add payload info to token
          token.payload = {
            exp: payload.exp,
            iat: payload.iat,
            expValid: payload.exp ? payload.exp * 1000 > Date.now() : false,
            hasUid: !!payload.uid,
            uid: payload.uid,
            hasRole: !!payload.role,
            role: payload.role,
            claims: Object.keys(payload).filter(key => !['exp', 'iat', 'uid'].includes(key))
          };
        } catch (decodeError) {
          token.decodeError = String(decodeError);
        }
      }
    } catch (error) {
      console.error('Error analyzing token:', error);
    }
  }
  
  return NextResponse.json({ token });
} 