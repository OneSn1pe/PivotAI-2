import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/config/firebase';
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
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
      user: null as any,
      userRecord: null as any
    },
    recruiterCheck: {
      isRecruiterByRole: false,
      isRecruiterByCustomClaim: false,
      isRecruiterByFirestore: false
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
    firestoreRulesTest: {
      success: false,
      error: null as string | null,
      results: null as any
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
      
      // Get user record for more details
      try {
        if (!adminAuth) {
          throw new Error('Firebase Admin Auth not initialized');
        }
        
        const userRecord = await adminAuth.getUser(decodedClaims.uid);
        diagnostics.auth.userRecord = {
          uid: userRecord.uid,
          email: userRecord.email,
          emailVerified: userRecord.emailVerified,
          displayName: userRecord.displayName,
          customClaims: userRecord.customClaims
        };
        
        // Check if user is a recruiter by different methods
        diagnostics.recruiterCheck.isRecruiterByRole = 
          decodedClaims.role === UserRole.RECRUITER || 
          decodedClaims.role === 'recruiter' || 
          decodedClaims.role === 'RECRUITER';
        
        diagnostics.recruiterCheck.isRecruiterByCustomClaim = 
          userRecord.customClaims?.role === UserRole.RECRUITER || 
          userRecord.customClaims?.role === 'recruiter' || 
          userRecord.customClaims?.role === 'RECRUITER';
        
        // Check Firestore user document
        try {
          const userDocRef = doc(db, 'users', decodedClaims.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            diagnostics.recruiterCheck.isRecruiterByFirestore = 
              userData.role === UserRole.RECRUITER || 
              userData.role === 'recruiter' || 
              userData.role === 'RECRUITER';
            
            // Add user data from Firestore
            diagnostics.auth.user.firestoreData = {
              role: userData.role,
              displayName: userData.displayName,
              company: userData.company
            };
          }
        } catch (firestoreError) {
          console.error('Error fetching user document:', firestoreError);
        }
      } catch (userRecordError) {
        console.error('Error fetching user record:', userRecordError);
      }
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
    const isRecruiter = diagnostics.recruiterCheck.isRecruiterByRole || 
                        diagnostics.recruiterCheck.isRecruiterByCustomClaim || 
                        diagnostics.recruiterCheck.isRecruiterByFirestore;
    
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
    
    // 5. Test Firestore rules directly
    try {
      const testResults = [];
      
      // Test access to recruiter_only_test collection
      try {
        await setDoc(doc(db, 'recruiter_only_test', `test_${Date.now()}`), {
          timestamp: new Date(),
          testType: 'recruiter_access_test'
        });
        
        testResults.push({
          name: 'Recruiter-Only Collection Write',
          passed: true,
          details: 'Successfully wrote to recruiter_only_test collection'
        });
      } catch (testError) {
        testResults.push({
          name: 'Recruiter-Only Collection Write',
          passed: false,
          error: String(testError)
        });
      }
      
      diagnostics.firestoreRulesTest.success = true;
      diagnostics.firestoreRulesTest.results = testResults;
    } catch (rulesTestError) {
      diagnostics.firestoreRulesTest.error = String(rulesTestError);
    }
    
    // 6. Finalize response
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