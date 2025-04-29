import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/config/firebase';
import { collection, query, where, getDocs, deleteDoc, doc, Firestore } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    // Verify Firebase is initialized
    if (!db) {
      throw new Error('Firebase Firestore is not initialized');
    }

    const { candidateId } = await request.json();

    // Validate candidateId is provided
    if (!candidateId) {
      return NextResponse.json(
        { error: 'candidateId is required to delete roadmaps' },
        { status: 400 }
      );
    }

    // Query for all roadmaps for this candidate
    const roadmapQuery = query(
      collection(db as Firestore, 'roadmaps'),
      where('candidateId', '==', candidateId)
    );
    
    const roadmapSnapshot = await getDocs(roadmapQuery);
    
    if (roadmapSnapshot.empty) {
      return NextResponse.json({ 
        message: 'No roadmaps found to delete', 
        count: 0 
      });
    }
    
    // Delete all found roadmaps
    const deletePromises = roadmapSnapshot.docs.map(roadmapDoc => 
      deleteDoc(doc(db as Firestore, 'roadmaps', roadmapDoc.id))
    );
    
    await Promise.all(deletePromises);
    
    return NextResponse.json({ 
      message: 'Roadmaps deleted successfully', 
      count: roadmapSnapshot.size 
    });

  } catch (error) {
    console.error('Error deleting roadmaps:', error);
    return NextResponse.json(
      { error: 'Failed to delete roadmaps', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 