import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { UserRole } from '@/types/user';
import { cookies } from 'next/headers';
import { validateSession } from '@/utils/server-auth';
import { adminAuth } from '@/config/firebase-admin';

// Mark this file as server-only
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const start = Date.now();
  const url = new URL(request.url);
  const candidateId = url.searchParams.get('candidateId');
  const sessionCookie = cookies().get('session')?.value;
  
  // Response structure for diagnostics
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      isDev: process.env.NODE_ENV === 'development',
      isProd: process.env.NODE_ENV === 'production',
      devMode: process.env.NEXT_PUBLIC_DEVELOPMENT_MODE === 'true',
    },
    request: {
      url: request.url,
      candidateId,
      headers: {
        host: request.headers.get('host'),
        referer: request.headers.get('referer'),
        userAgent: request.headers.get('user-agent')
      }
    },
    auth: {
      sessionCookie: {
        present: !!sessionCookie,
        length: sessionCookie?.length || 0
      },
      validation: {
        success: false,
        method: '',
        error: null as string | null,
        time: 0
      },
      user: null as any
    },
    roadmap: {
      query: {
        collection: 'roadmaps',
        filter: candidateId ? `candidateId == ${candidateId}` : null,
      },
      result: {
        success: false,
        found: false,
        error: null as string | null,
        time: 0,
        data: null as any
      }
    },
    totalTime: 0
  };
  
  try {
    // 1. Validate session
    if (!sessionCookie) {
      diagnostics.auth.validation.error = 'No session cookie found';
      return NextResponse.json(diagnostics, { status: 401 });
    }
    
    try {
      const validationStart = Date.now();
      diagnostics.auth.validation.method = 'validateSession';
      
      const decodedClaims = await validateSession(sessionCookie);
      
      diagnostics.auth.validation.time = Date.now() - validationStart;
      diagnostics.auth.validation.success = true;
      diagnostics.auth.user = {
        uid: decodedClaims.uid,
        email: decodedClaims.email,
        role: decodedClaims.role || 'undefined',
        emailVerified: decodedClaims.email_verified,
      };
    } catch (validationError) {
      diagnostics.auth.validation.error = String(validationError);
      return NextResponse.json(diagnostics, { status: 401 });
    }
    
    // 2. Check candidateId parameter
    if (!candidateId) {
      diagnostics.roadmap.result.error = 'Missing candidateId parameter';
      return NextResponse.json(diagnostics, { status: 400 });
    }
    
    // 3. Authorization check
    const isOwner = diagnostics.auth.user.uid === candidateId;
    const isRecruiter = diagnostics.auth.user.role === UserRole.RECRUITER;
    
    diagnostics.auth.user.isOwner = isOwner;
    diagnostics.auth.user.isRecruiter = isRecruiter;
    diagnostics.auth.user.hasAccess = isOwner || isRecruiter;
    
    if (!isOwner && !isRecruiter) {
      diagnostics.roadmap.result.error = 'Access denied: User is not owner or recruiter';
      return NextResponse.json(diagnostics, { status: 403 });
    }
    
    // 4. Fetch roadmap data
    try {
      const roadmapQueryStart = Date.now();
      
      const roadmapQuery = query(
        collection(db, "roadmaps"),
        where("candidateId", "==", candidateId)
      );
      
      const roadmapSnapshot = await getDocs(roadmapQuery);
      
      diagnostics.roadmap.result.time = Date.now() - roadmapQueryStart;
      diagnostics.roadmap.result.success = true;
      diagnostics.roadmap.result.found = !roadmapSnapshot.empty;
      
      if (!roadmapSnapshot.empty) {
        const roadmapDoc = roadmapSnapshot.docs[0];
        diagnostics.roadmap.result.data = {
          id: roadmapDoc.id,
          createdAt: roadmapDoc.data().createdAt?.toDate?.() || roadmapDoc.data().createdAt,
          updatedAt: roadmapDoc.data().updatedAt?.toDate?.() || roadmapDoc.data().updatedAt,
          milestoneCount: roadmapDoc.data().milestones?.length || 0
        };
      }
    } catch (roadmapError) {
      diagnostics.roadmap.result.error = String(roadmapError);
      diagnostics.roadmap.result.success = false;
    }
    
    // 5. Finalize response
    diagnostics.totalTime = Date.now() - start;
    
    return NextResponse.json(diagnostics);
  } catch (error) {
    diagnostics.totalTime = Date.now() - start;
    return NextResponse.json({
      ...diagnostics,
      error: String(error)
    }, { status: 500 });
  }
} 