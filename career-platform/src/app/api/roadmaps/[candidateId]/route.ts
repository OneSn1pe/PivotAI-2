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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    // Verify the session cookie
    const decodedClaims = await validateSession(sessionCookie);
    const { uid: userId, role } = decodedClaims;
    const { candidateId } = params;

    // Authorization check
    const isOwner = userId === candidateId;
    const isRecruiter = role === UserRole.RECRUITER;

    if (!isOwner && !isRecruiter) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch roadmap data
    const roadmapQuery = query(
      collection(db, "roadmaps"),
      where("candidateId", "==", candidateId)
    );
    
    const roadmapSnapshot = await getDocs(roadmapQuery);
    
    if (roadmapSnapshot.empty) {
      return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });
    }
    
    const roadmapDoc = roadmapSnapshot.docs[0];
    const roadmapData = {
      id: roadmapDoc.id,
      ...roadmapDoc.data()
    };
    
    // Log access for auditing
    console.log(`User ${userId} (${role}) accessed roadmap for candidate ${candidateId}`);
    
    return NextResponse.json({ roadmap: roadmapData });
  } catch (error) {
    console.error("Error fetching roadmap:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 