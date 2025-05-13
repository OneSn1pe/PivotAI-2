import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/config/firebase';
import { doc, getDoc } from 'firebase/firestore';
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

    // Fetch candidate data
    const candidateDoc = await getDoc(doc(db, "users", candidateId));
    
    if (!candidateDoc.exists()) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }
    
    const candidateData = candidateDoc.data();
    
    // Return only basic information
    const basicInfo = {
      displayName: candidateData.displayName,
      email: candidateData.email,
      uid: candidateData.uid,
    };
    
    return NextResponse.json(basicInfo);
  } catch (error) {
    console.error("Error fetching candidate info:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 