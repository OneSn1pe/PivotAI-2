import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminApp } from '@/config/firebase-admin';
import { cookies } from 'next/headers';
import { validateSession } from '@/utils/server-auth';
import { normalizeRole } from '@/utils/environment';
import { UserRole } from '@/types/user';

// Mark this file as server-only
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from session cookie
    const sessionCookie = cookies().get('session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        details: "No session cookie found"
      }, { status: 401 });
    }
    
    // Validate session
    const decodedClaims = await validateSession(sessionCookie);
    
    if (!decodedClaims || !decodedClaims.uid) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        details: "Invalid session"
      }, { status: 401 });
    }
    
    const userRole = decodedClaims.role as string;
    
    // Only recruiters or in development mode
    const isRecruiter = normalizeRole(userRole) === normalizeRole(UserRole.RECRUITER);
    const isDevelopment = process.env.NEXT_PUBLIC_DEVELOPMENT_MODE === 'true';
    
    if (!isRecruiter && !isDevelopment) {
      return NextResponse.json({ 
        error: "Forbidden", 
        details: "Only recruiters can access candidate list"
      }, { status: 403 });
    }
    
    // Get Firebase Admin services
    const services = getFirebaseAdminApp();
    if (!services || !services.db) {
      return NextResponse.json({ 
        error: "Server Error", 
        details: "Firebase Admin not initialized"
      }, { status: 500 });
    }
    
    // Query candidates from Firestore
    const candidatesSnapshot = await services.db
      .collection('users')
      .where('role', '==', UserRole.CANDIDATE)
      .limit(10)
      .get();
    
    const candidates = candidatesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        displayName: data.displayName || 'Unknown',
        email: data.email || 'No email',
        createdAt: data.createdAt?.toDate?.() || null
      };
    });
    
    return NextResponse.json({
      candidates,
      count: candidates.length
    });
    
  } catch (error) {
    console.error('Error fetching candidates:', error);
    
    return NextResponse.json({ 
      error: "Server Error", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 