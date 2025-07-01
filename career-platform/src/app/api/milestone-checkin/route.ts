import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { MilestoneCheckIn } from '@/types/user';

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const auth = getAuth();
const db = getFirestore();

export async function POST(request: Request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Parse request body
    const body = await request.json();
    const checkInData: Omit<MilestoneCheckIn, 'id' | 'userId' | 'createdAt'> = body;

    // Validate required fields
    if (!checkInData.milestoneId || !checkInData.milestoneTitle) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create check-in document
    const checkIn: Omit<MilestoneCheckIn, 'id'> = {
      ...checkInData,
      userId,
      createdAt: new Date(),
    };

    // Save to Firestore
    const docRef = await db.collection('milestoneCheckIns').add({
      ...checkIn,
      createdAt: new Date().toISOString(),
      completedAt: checkIn.completedAt.toISOString(),
    });

    // Also update user's analytics/progress data
    const userProgressRef = db.collection('userProgress').doc(userId);
    await userProgressRef.update({
      lastCheckInDate: new Date().toISOString(),
      totalCheckIns: db.FieldValue.increment(1),
      [`checkInsByMilestone.${checkInData.milestoneId}`]: {
        checkInId: docRef.id,
        completedAt: checkIn.completedAt.toISOString(),
        resourcesHelpful: checkInData.resourcesHelpful,
        objectiveAchieved: checkInData.objectiveAchieved,
        confidenceLevel: checkInData.confidenceLevel,
        applicability: checkInData.applicability,
      }
    });

    return NextResponse.json({
      success: true,
      checkInId: docRef.id,
    });
  } catch (error) {
    console.error('Error saving milestone check-in:', error);
    return NextResponse.json(
      { error: 'Failed to save check-in' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const milestoneId = searchParams.get('milestoneId');

    // Query check-ins
    let query = db.collection('milestoneCheckIns')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc');

    if (milestoneId) {
      query = query.where('milestoneId', '==', milestoneId);
    }

    const snapshot = await query.limit(50).get();
    const checkIns = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ checkIns });
  } catch (error) {
    console.error('Error fetching milestone check-ins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch check-ins' },
      { status: 500 }
    );
  }
}