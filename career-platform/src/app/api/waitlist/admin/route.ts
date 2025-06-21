import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { verifyToken } from '@/utils/server-auth';

export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1] || req.cookies.get('session')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const verifiedUser = await verifyToken(token);
    if (!verifiedUser || verifiedUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    // Fetch all waitlist entries
    const waitlistQuery = query(
      collection(db, 'waitlist'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(waitlistQuery);
    const waitlistEntries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
    }));

    return NextResponse.json({
      total: waitlistEntries.length,
      entries: waitlistEntries
    });

  } catch (error) {
    console.error('Error fetching waitlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch waitlist entries' },
      { status: 500 }
    );
  }
}

// Export waitlist as CSV
export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1] || req.cookies.get('session')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const verifiedUser = await verifyToken(token);
    if (!verifiedUser || verifiedUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    // Fetch all waitlist entries
    const waitlistQuery = query(
      collection(db, 'waitlist'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(waitlistQuery);
    const waitlistEntries = snapshot.docs.map(doc => ({
      email: doc.data().email,
      createdAt: doc.data().createdAt?.toDate?.().toISOString() || doc.data().createdAt,
      source: doc.data().source || 'unknown',
      notified: doc.data().notified || false
    }));

    // Create CSV
    const headers = ['Email', 'Joined Date', 'Source', 'Notified'];
    const rows = waitlistEntries.map(entry => [
      entry.email,
      entry.createdAt,
      entry.source,
      entry.notified
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="waitlist-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error('Error exporting waitlist:', error);
    return NextResponse.json(
      { error: 'Failed to export waitlist' },
      { status: 500 }
    );
  }
}