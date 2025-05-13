import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseAdmin, adminAuth, adminDb } from '@/config/firebase-admin';
import { UserRole } from '@/types/user';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const candidateId = params.id;
  
  try {
    // Get session token from cookies
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie?.value) {
      console.error('[API] No session cookie found');
      return NextResponse.json(
        { error: 'Unauthorized - No session cookie' },
        { status: 401 }
      );
    }
    
    // Verify the session cookie
    if (!adminAuth) {
      console.error('[API] Firebase Admin Auth not initialized');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    try {
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie.value, true);
      
      if (!decodedClaims) {
        console.error('[API] Invalid session cookie');
        return NextResponse.json(
          { error: 'Unauthorized - Invalid session' },
          { status: 401 }
        );
      }
      
      // Get user data from Firestore
      if (!adminDb) {
        console.error('[API] Firebase Admin Firestore not initialized');
        return NextResponse.json(
          { error: 'Server configuration error' },
          { status: 500 }
        );
      }
      
      const userDoc = await adminDb.collection('users').doc(decodedClaims.uid).get();
      
      if (!userDoc.exists) {
        console.error('[API] User document not found');
        return NextResponse.json(
          { error: 'Unauthorized - User not found' },
          { status: 401 }
        );
      }
      
      const userData = userDoc.data();
      const userRole = userData?.role;
      
      // Check authorization: user must be a recruiter or the candidate themselves
      const isAuthorized = 
        userRole === UserRole.RECRUITER || 
        decodedClaims.uid === candidateId;
      
      if (!isAuthorized) {
        console.error('[API] User not authorized to view this roadmap');
        return NextResponse.json(
          { error: 'Forbidden - Insufficient permissions' },
          { status: 403 }
        );
      }
      
      // Fetch the roadmap data
      const roadmapsQuery = await adminDb.collection('roadmaps')
        .where('candidateId', '==', candidateId)
        .limit(1)
        .get();
      
      if (roadmapsQuery.empty) {
        return NextResponse.json(
          { error: 'Roadmap not found' },
          { status: 404 }
        );
      }
      
      // Get the roadmap data
      const roadmapDoc = roadmapsQuery.docs[0];
      const roadmapData = roadmapDoc.data();
      
      // Also fetch the candidate profile for additional context
      const candidateDoc = await adminDb.collection('users').doc(candidateId).get();
      
      if (!candidateDoc.exists) {
        return NextResponse.json(
          { error: 'Candidate not found' },
          { status: 404 }
        );
      }
      
      const candidateData = candidateDoc.data();
      
      // Return the roadmap and candidate data
      return NextResponse.json({
        roadmap: {
          id: roadmapDoc.id,
          ...roadmapData
        },
        candidate: {
          id: candidateDoc.id,
          ...candidateData
        }
      });
    } catch (authError) {
      console.error('[API] Session verification error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid session' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('[API] Error fetching roadmap:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 