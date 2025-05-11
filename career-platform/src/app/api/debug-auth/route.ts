import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
let adminApp: admin.app.App;
try {
  adminApp = admin.apps.length 
    ? admin.app() 
    : admin.initializeApp({
        credential: admin.credential.cert(
          JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}')
        ),
      });
} catch (e) {
  console.error('Firebase admin initialization error:', e);
}

// Create a safe way to check auth without compromising security
export async function GET(request: NextRequest) {
  try {
    // Extract the token from the Authorization header or cookie
    const authHeader = request.headers.get('Authorization');
    const sessionCookie = request.cookies.get('session')?.value;
    
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (sessionCookie) {
      token = sessionCookie;
    } else {
      return NextResponse.json(
        { error: 'No authentication token provided' },
        { status: 401 }
      );
    }
    
    // Verify the token and get user info
    let userId = '';
    let userRole = '';
    let decodedToken = null;
    
    try {
      // Try to verify using Firebase Admin first (for server auth)
      if (adminApp) {
        decodedToken = await admin.auth(adminApp).verifyIdToken(token);
        userId = decodedToken.uid;
      } else {
        throw new Error('Firebase Admin not initialized');
      }
    } catch (adminError) {
      console.error('Admin token verification error:', adminError);
      
      // Fall back to client auth for client-side tokens
      try {
        const user = auth.currentUser;
        if (user) {
          userId = user.uid;
        } else {
          throw new Error('No current user in auth');
        }
      } catch (clientError) {
        console.error('Client auth error:', clientError);
        throw new Error('Failed to authenticate user');
      }
    }
    
    if (!userId) {
      throw new Error('Could not determine user ID');
    }
    
    // Get user profile from Firestore
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      return NextResponse.json(
        { 
          status: 'error',
          message: 'User profile not found',
          auth: { 
            authenticated: true,
            userId 
          },
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      );
    }
    
    const userData = userDoc.data();
    userRole = userData.role;
    
    // Check access permissions for candidate data
    let canAccessCandidateData = userRole === 'RECRUITER' || userRole === 'recruiter';
    
    // Return detailed auth info for debugging
    return NextResponse.json({
      status: 'success',
      auth: {
        authenticated: true,
        userId,
        userRole,
        canAccessCandidateData,
        tokenValid: !!decodedToken
      },
      permissions: {
        isRecruiter: userRole === 'RECRUITER' || userRole === 'recruiter',
        isCandidate: userRole === 'CANDIDATE' || userRole === 'candidate',
        canAccessCandidateData
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Auth debug error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 