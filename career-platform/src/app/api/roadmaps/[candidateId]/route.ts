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
  const start = performance.now();
  const isDebugMode = request.headers.get('X-Debug-Mode') === 'true';
  const logs: string[] = [];
  
  const addLog = (message: string) => {
    console.log(`[roadmaps-api] ${message}`);
    if (isDebugMode) {
      logs.push(message);
    }
  };
  
  // Get authenticated user from session cookie
  const sessionCookie = cookies().get('session')?.value;
  
  addLog(`Request for candidate ID: ${params.candidateId}`);
  addLog(`Session cookie present: ${!!sessionCookie}`);
  
  if (!sessionCookie) {
    addLog('No session cookie found, returning 401');
    return NextResponse.json({ 
      error: "Unauthorized", 
      details: "No session cookie found",
      debug: isDebugMode ? logs : undefined
    }, { status: 401 });
  }
  
  try {
    addLog('Validating session...');
    const validateStart = performance.now();
    const decodedClaims = await validateSession(sessionCookie);
    const validateTime = performance.now() - validateStart;
    addLog(`Session validated in ${validateTime.toFixed(2)}ms`);
    
    if (!decodedClaims || !decodedClaims.uid) {
      addLog('Invalid session claims, returning 401');
      return NextResponse.json({ 
        error: "Unauthorized", 
        details: "Invalid session claims",
        debug: isDebugMode ? logs : undefined
      }, { status: 401 });
    }
    
    const userId = decodedClaims.uid;
    const userRole = decodedClaims.role as UserRole;
    
    addLog(`User ID: ${userId}`);
    addLog(`User role: ${userRole || 'not set'}`);
    
    // Check if user has permission to access this roadmap
    const candidateId = params.candidateId;
    
    if (!candidateId) {
      addLog('No candidate ID provided, returning 400');
      return NextResponse.json({ 
        error: "Bad Request", 
        details: "Candidate ID is required",
        debug: isDebugMode ? logs : undefined
      }, { status: 400 });
    }
    
    // Determine access permission
    let hasAccess = false;
    
    // Candidate can access their own roadmap
    if (userRole === UserRole.CANDIDATE && userId === candidateId) {
      addLog('Access granted: Candidate accessing own roadmap');
      hasAccess = true;
    }
    // Recruiters can access any candidate's roadmap
    else if (userRole === UserRole.RECRUITER) {
      addLog('Access granted: User is a recruiter');
      hasAccess = true;
    }
    // Special development mode bypass
    else if (process.env.NEXT_PUBLIC_DEVELOPMENT_MODE === 'true') {
      addLog('⚠️ Access granted: Development mode bypass');
      hasAccess = true;
    }
    
    if (!hasAccess) {
      addLog(`Access denied: User ${userId} with role ${userRole} cannot access roadmap for ${candidateId}`);
      return NextResponse.json({ 
        error: "Forbidden", 
        details: "You don't have permission to access this roadmap",
        debug: isDebugMode ? logs : undefined
      }, { status: 403 });
    }
    
    // Query the roadmap from Firestore
    addLog('Querying roadmap from Firestore...');
    const queryStart = performance.now();
    
    try {
      const roadmapQuery = query(
        collection(db, 'roadmaps'),
        where('candidateId', '==', candidateId)
      );
      
      const querySnapshot = await getDocs(roadmapQuery);
      const queryTime = performance.now() - queryStart;
      addLog(`Firestore query completed in ${queryTime.toFixed(2)}ms`);
      
      if (querySnapshot.empty) {
        addLog('No roadmap found for this candidate');
        return NextResponse.json({ 
          error: "Not Found", 
          details: "No roadmap found for this candidate",
          debug: isDebugMode ? logs : undefined
        }, { status: 404 });
      }
      
      // Get the first matching roadmap
      const roadmapDoc = querySnapshot.docs[0];
      const roadmapData = roadmapDoc.data();
      
      addLog(`Roadmap found: ID=${roadmapDoc.id}`);
      addLog(`Milestones count: ${roadmapData.milestones?.length || 0}`);
      
      const totalTime = performance.now() - start;
      addLog(`Total processing time: ${totalTime.toFixed(2)}ms`);
      
      // Return the roadmap data
      return NextResponse.json({
        roadmap: {
          id: roadmapDoc.id,
          ...roadmapData
        },
        debug: isDebugMode ? {
          logs,
          timing: {
            total: totalTime,
            validation: validateTime,
            query: queryTime
          },
          user: {
            id: userId,
            role: userRole
          }
        } : undefined
      });
      
    } catch (firestoreError) {
      addLog(`Firestore error: ${firestoreError instanceof Error ? firestoreError.message : String(firestoreError)}`);
      return NextResponse.json({ 
        error: "Database Error", 
        details: firestoreError instanceof Error ? firestoreError.message : "Error querying roadmap data",
        debug: isDebugMode ? logs : undefined
      }, { status: 500 });
    }
    
  } catch (error) {
    addLog(`Authentication error: ${error instanceof Error ? error.message : String(error)}`);
    
    return NextResponse.json({ 
      error: "Authentication Error", 
      details: error instanceof Error ? error.message : "Failed to validate session",
      debug: isDebugMode ? logs : undefined
    }, { status: 401 });
  }
} 