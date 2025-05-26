import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { 
  DailySchedule, 
  DailyTask, 
  CareerRoadmap, 
  SchedulePreferences,
  WeeklyProgress 
} from '@/types/user';
import { 
  generateDailySchedule, 
  calculateWeeklyProgress,
  completeTask,
  deferTask,
  DEFAULT_SCHEDULE_PREFERENCES,
  generateWeeklySchedule
} from '@/utils/taskScheduleUtils';

// Helper function to set CORS headers
const setCorsHeaders = (response: NextResponse) => {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
};

// Handle OPTIONS requests (CORS preflight)
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  return setCorsHeaders(response);
}

// GET: Retrieve daily schedule or weekly progress
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidateId');
    const date = searchParams.get('date');
    const type = searchParams.get('type') || 'daily'; // 'daily' or 'weekly'

    if (!candidateId) {
      return setCorsHeaders(NextResponse.json({ error: 'candidateId is required' }, { status: 400 }));
    }

    if (type === 'weekly') {
      // Get weekly progress or generate new weekly schedule
      const weeklyData = await getWeeklyProgress(candidateId, date);
      if (!weeklyData) {
        const roadmap = await getCandidateRoadmap(candidateId);
        if (!roadmap) {
          return setCorsHeaders(NextResponse.json({ error: 'No roadmap found for candidate' }, { status: 404 }));
        }
        const resources = roadmap.milestones.flatMap(m => m.resources.map(r => r.url));
        const newWeeklySchedule = await generateWeeklySchedule(candidateId, roadmap.milestones, resources);
        // Save new weekly schedule to Firestore (similar to daily schedule logic)
        // ...
        return setCorsHeaders(NextResponse.json(newWeeklySchedule));
      }
      return setCorsHeaders(NextResponse.json(weeklyData));
    } else {
      // Get daily schedule
      const targetDate = date ? new Date(date) : new Date();
      const schedule = await getDailySchedule(candidateId, targetDate);
      return setCorsHeaders(NextResponse.json(schedule));
    }
  } catch (error) {
    console.error('Error in GET /api/daily-schedule:', error);
    return setCorsHeaders(NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    ));
  }
}

// POST: Create or generate new daily schedule
export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const { candidateId, date, preferences, regenerate = false, type = 'daily' } = requestData;

    if (!candidateId) {
      return setCorsHeaders(NextResponse.json({ error: 'candidateId is required' }, { status: 400 }));
    }

    const targetDate = date ? new Date(date) : new Date();
    
    // Get user's roadmap
    const roadmap = await getCandidateRoadmap(candidateId);
    if (!roadmap) {
      return setCorsHeaders(NextResponse.json({ error: 'No roadmap found for candidate' }, { status: 404 }));
    }

    // Use provided preferences or defaults
    const schedulePreferences = preferences || { 
      ...DEFAULT_SCHEDULE_PREFERENCES, 
      userId: candidateId 
    };

    if (type === 'weekly') {
      // Generate new weekly schedule
      const resources = roadmap.milestones.flatMap(m => m.resources.map(r => r.url));
      const newWeeklySchedule = await generateWeeklySchedule(candidateId, roadmap.milestones, resources);
      // Save new weekly schedule to Firestore (similar to daily schedule logic)
      // ...
      return setCorsHeaders(NextResponse.json(newWeeklySchedule, { status: 201 }));
    }

    // Check if schedule already exists for this date
    const existingSchedule = await getDailySchedule(candidateId, targetDate);
    
    if (existingSchedule && !regenerate) {
      return setCorsHeaders(NextResponse.json(existingSchedule));
    }

    // Generate new schedule
    const newSchedule = generateDailySchedule(
      candidateId,
      roadmap.milestones,
      targetDate,
      schedulePreferences
    );

    // Save to Firestore
    const docRef = await addDoc(collection(db, 'daily-schedules'), {
      ...newSchedule,
      date: targetDate.toISOString().split('T')[0] // Store as YYYY-MM-DD string
    });

    const savedSchedule = { ...newSchedule, id: docRef.id };

    return setCorsHeaders(NextResponse.json(savedSchedule, { status: 201 }));
  } catch (error) {
    console.error('Error in POST /api/daily-schedule:', error);
    return setCorsHeaders(NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    ));
  }
}

// PUT: Update daily schedule (complete tasks, defer tasks, etc.)
export async function PUT(request: NextRequest) {
  try {
    const requestData = await request.json();
    const { scheduleId, taskUpdates, action } = requestData;

    if (!scheduleId) {
      return setCorsHeaders(NextResponse.json({ error: 'scheduleId is required' }, { status: 400 }));
    }

    // Get existing schedule
    const scheduleQuery = query(
      collection(db, 'daily-schedules'),
      where('id', '==', scheduleId)
    );
    const scheduleSnapshot = await getDocs(scheduleQuery);
    
    if (scheduleSnapshot.empty) {
      return setCorsHeaders(NextResponse.json({ error: 'Schedule not found' }, { status: 404 }));
    }

    const scheduleDoc = scheduleSnapshot.docs[0];
    const schedule = scheduleDoc.data() as DailySchedule;

    let updatedSchedule = { ...schedule };

    // Handle different types of updates
    if (action === 'complete-task' && taskUpdates) {
      const { taskId, notes } = taskUpdates;
      updatedSchedule.tasks = schedule.tasks.map(task => 
        task.id === taskId ? completeTask(task, notes) : task
      );
      updatedSchedule.completedTasks = updatedSchedule.tasks.filter(t => t.completed).length;
    } else if (action === 'defer-task' && taskUpdates) {
      const { taskId, newDate, reason } = taskUpdates;
      updatedSchedule.tasks = schedule.tasks.map(task => 
        task.id === taskId ? deferTask(task, new Date(newDate), reason) : task
      );
    } else if (action === 'update-tasks' && taskUpdates) {
      // Bulk update tasks
      updatedSchedule.tasks = taskUpdates;
      updatedSchedule.completedTasks = taskUpdates.filter((t: DailyTask) => t.completed).length;
    }

    updatedSchedule.updatedAt = new Date();

    // Update in Firestore
    await updateDoc(doc(db, 'daily-schedules', scheduleDoc.id), updatedSchedule);

    return setCorsHeaders(NextResponse.json(updatedSchedule));
  } catch (error) {
    console.error('Error in PUT /api/daily-schedule:', error);
    return setCorsHeaders(NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    ));
  }
}

// DELETE: Remove a daily schedule
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('scheduleId');

    if (!scheduleId) {
      return setCorsHeaders(NextResponse.json({ error: 'scheduleId is required' }, { status: 400 }));
    }

    // Delete from Firestore
    await deleteDoc(doc(db, 'daily-schedules', scheduleId));

    return setCorsHeaders(NextResponse.json({ message: 'Schedule deleted successfully' }));
  } catch (error) {
    console.error('Error in DELETE /api/daily-schedule:', error);
    return setCorsHeaders(NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    ));
  }
}

// Helper functions
async function getCandidateRoadmap(candidateId: string): Promise<CareerRoadmap | null> {
  try {
    const roadmapQuery = query(
      collection(db, 'roadmaps'),
      where('candidateId', '==', candidateId)
    );
    const roadmapSnapshot = await getDocs(roadmapQuery);
    
    if (roadmapSnapshot.empty) {
      return null;
    }

    const roadmapDoc = roadmapSnapshot.docs[0];
    return { ...roadmapDoc.data(), id: roadmapDoc.id } as CareerRoadmap;
  } catch (error) {
    console.error('Error fetching roadmap:', error);
    return null;
  }
}

async function getDailySchedule(candidateId: string, date: Date): Promise<DailySchedule | null> {
  try {
    const dateString = date.toISOString().split('T')[0];
    const scheduleQuery = query(
      collection(db, 'daily-schedules'),
      where('candidateId', '==', candidateId),
      where('date', '==', dateString)
    );
    const scheduleSnapshot = await getDocs(scheduleQuery);
    
    if (scheduleSnapshot.empty) {
      return null;
    }

    const scheduleDoc = scheduleSnapshot.docs[0];
    const data = scheduleDoc.data();
    
    return {
      ...data,
      id: scheduleDoc.id,
      date: new Date(data.date),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      tasks: data.tasks?.map((task: any) => ({
        ...task,
        scheduledDate: new Date(task.scheduledDate),
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
        deferredTo: task.deferredTo ? new Date(task.deferredTo) : undefined
      })) || []
    } as DailySchedule;
  } catch (error) {
    console.error('Error fetching daily schedule:', error);
    return null;
  }
}

async function getWeeklyProgress(candidateId: string, dateString?: string | null): Promise<WeeklyProgress> {
  try {
    const targetDate = dateString ? new Date(dateString) : new Date();
    
    // Get week start and end dates
    const weekStart = new Date(targetDate);
    weekStart.setDate(targetDate.getDate() - targetDate.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Query schedules for the week
    const scheduleQuery = query(
      collection(db, 'daily-schedules'),
      where('candidateId', '==', candidateId),
      where('date', '>=', weekStart.toISOString().split('T')[0]),
      where('date', '<=', weekEnd.toISOString().split('T')[0])
    );
    
    const scheduleSnapshot = await getDocs(scheduleQuery);
    const schedules: DailySchedule[] = scheduleSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        date: new Date(data.date),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        tasks: data.tasks?.map((task: any) => ({
          ...task,
          scheduledDate: new Date(task.scheduledDate),
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
          deferredTo: task.deferredTo ? new Date(task.deferredTo) : undefined
        })) || []
      } as DailySchedule;
    });

    return calculateWeeklyProgress(schedules);
  } catch (error) {
    console.error('Error calculating weekly progress:', error);
    // Return empty progress on error
    const now = new Date();
    return {
      weekStartDate: now,
      weekEndDate: now,
      totalTasksScheduled: 0,
      totalTasksCompleted: 0,
      totalMinutesScheduled: 0,
      totalMinutesWorked: 0,
      milestoneProgress: [],
      streakDays: 0,
      categoryBreakdown: {}
    };
  }
} 