import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/config/firebase';
import { collection, getDocs, deleteDoc, doc, Firestore } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    // In production, we would check for admin authentication here
    
    // Verify Firebase is initialized
    if (!db) {
      throw new Error('Firebase Firestore is not initialized');
    }

    // Get all roadmaps
    const roadmapsCollection = collection(db as Firestore, 'roadmaps');
    const roadmapSnapshot = await getDocs(roadmapsCollection);
    
    if (roadmapSnapshot.empty) {
      return NextResponse.json({ 
        message: 'No roadmaps found to delete', 
        count: 0 
      });
    }
    
    // Delete all roadmaps
    const deletePromises = roadmapSnapshot.docs.map(roadmapDoc => 
      deleteDoc(doc(db as Firestore, 'roadmaps', roadmapDoc.id))
    );
    
    await Promise.all(deletePromises);
    
    return NextResponse.json({ 
      message: 'All roadmaps deleted successfully', 
      count: roadmapSnapshot.size 
    });

  } catch (error) {
    console.error('Error deleting all roadmaps:', error);
    return NextResponse.json(
      { error: 'Failed to delete roadmaps', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 