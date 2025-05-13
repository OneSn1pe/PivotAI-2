import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { UserRole } from '@/types/user';
import { cookies } from 'next/headers';
import { validateSession } from '@/utils/server-auth';

// Mark this file as server-only
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { candidateId: string } }
) {
  // Get authenticated user from session cookie
  const sessionCookie = cookies().get('session')?.value;
  
  if (!sessionCookie) {
    console.error('[roadmaps-api] No session cookie found');
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    // Verify the session cookie
    const decodedClaims = await validateSession(sessionCookie);
    const { uid: userId, role } = decodedClaims;
    const { candidateId } = params;

    console.log(`[roadmaps-api] User ${userId} with role ${role || 'undefined'} accessing roadmap for candidate ${candidateId}`);

    // Authorization check
    const isOwner = userId === candidateId;
    const isRecruiter = role === UserRole.RECRUITER;

    if (!isOwner && !isRecruiter) {
      console.error(`[roadmaps-api] Access denied: User ${userId} (role: ${role || 'undefined'}) is not owner or recruiter`);
      return NextResponse.json({ 
        error: "Forbidden", 
        details: {
          isOwner,
          isRecruiter,
          userRole: role || 'undefined',
          userId
        }
      }, { status: 403 });
    }

    // Fetch roadmap data
    const roadmapQuery = query(
      collection(db, "roadmaps"),
      where("candidateId", "==", candidateId)
    );
    
    const roadmapSnapshot = await getDocs(roadmapQuery);
    
    if (roadmapSnapshot.empty) {
      console.log(`[roadmaps-api] No roadmap found for candidate ${candidateId}`);
      return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });
    }
    
    const roadmapDoc = roadmapSnapshot.docs[0];
    const roadmapData = {
      id: roadmapDoc.id,
      ...roadmapDoc.data()
    };
    
    // Log access for auditing
    console.log(`[roadmaps-api] User ${userId} (${role || 'undefined'}) successfully accessed roadmap for candidate ${candidateId}`);
    
    // Create response with additional headers for debugging
    const response = NextResponse.json({ roadmap: roadmapData });
    response.headers.set('x-access-type', isOwner ? 'owner' : 'recruiter');
    response.headers.set('x-user-role', role || 'undefined');
    
    return response;
  } catch (error) {
    console.error("[roadmaps-api] Error fetching roadmap:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      message: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 