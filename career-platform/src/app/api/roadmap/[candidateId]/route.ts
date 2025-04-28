import { collection, query, orderBy, limit, getDocs, Firestore } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { NextResponse } from 'next/server';

interface CareerRoadmap {
  id: string;
  [key: string]: any;
}

export async function GET(
  request: Request,
  { params }: { params: { candidateId: string } }
) {
  try {
    const { candidateId } = params;
    
    // Get the most recent roadmap for the candidate
    const roadmapsRef = collection(db as Firestore, `users/${candidateId}/roadmaps`);
    const q = query(roadmapsRef, orderBy('createdAt', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return NextResponse.json({ error: 'No roadmap found' }, { status: 404 });
    }
    
    const roadmapDoc = querySnapshot.docs[0];
    const roadmap = { id: roadmapDoc.id, ...roadmapDoc.data() } as CareerRoadmap;
    
    return NextResponse.json(roadmap);
  } catch (error) {
    console.error('Error fetching roadmap:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roadmap' },
      { status: 500 }
    );
  }
} 