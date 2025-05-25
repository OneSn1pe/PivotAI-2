import { 
  Milestone, 
  DailyTask, 
  DailySchedule, 
  FocusBlock, 
  WeeklyProgress, 
  TaskTemplate, 
  SchedulePreferences,
  MilestoneCategory,
  ProfessionalField 
} from '@/types/user';
import { v4 as uuidv4 } from 'uuid';

// Default schedule preferences
export const DEFAULT_SCHEDULE_PREFERENCES: SchedulePreferences = {
  userId: '',
  workingHours: {
    start: '09:00',
    end: '17:00'
  },
  preferredFocusBlockDuration: 90, // 1.5 hours
  breakDuration: 15,
  workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  dailyGoalMinutes: 240, // 4 hours
  maxTasksPerDay: 6,
  priorityDistribution: {
    critical: 30,
    high: 40,
    medium: 25,
    low: 5
  },
  categoryPreferences: {
    technical: {
      preferredTimeOfDay: 'morning',
      maxMinutesPerDay: 120
    },
    fundamental: {
      preferredTimeOfDay: 'morning',
      maxMinutesPerDay: 90
    },
    niche: {
      preferredTimeOfDay: 'afternoon',
      maxMinutesPerDay: 60
    },
    soft: {
      preferredTimeOfDay: 'afternoon',
      maxMinutesPerDay: 60
    }
  }
};

// Generate daily tasks from milestones
export const generateDailyTasksFromMilestones = (
  milestones: Milestone[],
  targetDate: Date,
  preferences: SchedulePreferences
): DailyTask[] => {
  const tasks: DailyTask[] = [];
  const incompleteMilestones = milestones.filter(m => !m.completed);

  incompleteMilestones.forEach(milestone => {
    // Generate tasks from existing milestone tasks
    if (milestone.tasks && milestone.tasks.length > 0) {
      const incompleteTasks = milestone.tasks.filter(t => !t.completed);
      
      incompleteTasks.forEach(task => {
        tasks.push({
          id: uuidv4(),
          milestoneId: milestone.id,
          milestoneTitle: milestone.title,
          taskDescription: task.description,
          scheduledDate: targetDate,
          estimatedMinutes: estimateTaskDuration(task.description, milestone.category),
          priority: milestone.priority,
          category: milestone.category,
          professionalField: milestone.professionalField,
          completed: false,
          notes: task.notes,
          resourceLinks: milestone.resources.map(r => r.url),
          tags: [milestone.category, milestone.professionalField]
        });
      });
    } else {
      // Generate smart tasks based on milestone content
      const smartTasks = generateSmartTasksForMilestone(milestone);
      tasks.push(...smartTasks.map(task => ({
        ...task,
        scheduledDate: targetDate,
        milestoneId: milestone.id,
        milestoneTitle: milestone.title,
        priority: milestone.priority,
        category: milestone.category,
        professionalField: milestone.professionalField,
        completed: false,
        resourceLinks: milestone.resources.map(r => r.url),
        tags: [milestone.category, milestone.professionalField]
      })));
    }
  });

  // Sort and limit tasks based on preferences
  return prioritizeAndLimitTasks(tasks, preferences);
};

// Estimate task duration based on content and category
const estimateTaskDuration = (description: string, category: MilestoneCategory): number => {
  const words = description.split(' ').length;
  const baseMinutes = Math.max(15, Math.min(120, words * 3)); // 3 minutes per word, min 15, max 120

  // Category-specific multipliers
  const multipliers = {
    technical: 1.5,
    fundamental: 1.2,
    niche: 1.8,
    soft: 0.8,
    // Engineering categories
    design: 1.6,
    analysis: 1.4,
    implementation: 1.5,
    safety: 1.3,
    regulatory: 1.1,
    // Medicine categories
    clinical: 1.4,
    research: 1.6,
    'patient-care': 1.1,
    diagnostic: 1.3,
    compliance: 1.2,
    // Business categories
    strategy: 1.3,
    operations: 1.2,
    finance: 1.4,
    leadership: 1.1,
    'market-analysis': 1.5,
    // Law categories
    litigation: 1.7,
    advisory: 1.3,
    negotiation: 1.2
  };

  const multiplier = multipliers[category as keyof typeof multipliers] || 1.0;
  return Math.round(baseMinutes * multiplier);
};

// Generate intelligent tasks for a milestone
const generateSmartTasksForMilestone = (milestone: Milestone): Omit<DailyTask, 'scheduledDate' | 'milestoneId' | 'milestoneTitle' | 'priority' | 'category' | 'professionalField' | 'completed' | 'resourceLinks' | 'tags'>[] => {
  const tasks = [];

  // Research phase
  tasks.push({
    id: uuidv4(),
    taskDescription: `Research and understand: ${milestone.title}`,
    estimatedMinutes: 45,
    notes: `Study the fundamentals of ${milestone.title}. Review provided resources and take notes on key concepts.`
  });

  // Learning phase
  if (milestone.resources.length > 0) {
    tasks.push({
      id: uuidv4(),
      taskDescription: `Study primary resource: ${milestone.resources[0]?.title || 'Main learning material'}`,
      estimatedMinutes: 60,
      notes: 'Focus on understanding core concepts and taking detailed notes.'
    });
  }

  // Practice phase
  tasks.push({
    id: uuidv4(),
    taskDescription: `Practice: Apply ${milestone.title} concepts`,
    estimatedMinutes: 90,
    notes: 'Hands-on practice with the concepts learned. Create examples or work through exercises.'
  });

  // Review and consolidate
  tasks.push({
    id: uuidv4(),
    taskDescription: `Review and consolidate learning for: ${milestone.title}`,
    estimatedMinutes: 30,
    notes: 'Review notes, identify gaps, and prepare for next steps.'
  });

  return tasks;
};

// Prioritize and limit tasks based on preferences
const prioritizeAndLimitTasks = (tasks: DailyTask[], preferences: SchedulePreferences): DailyTask[] => {
  // Sort by priority and estimated time
  const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  
  const sortedTasks = tasks.sort((a, b) => {
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.estimatedMinutes - b.estimatedMinutes; // Shorter tasks first within same priority
  });

  // Limit tasks based on daily goal and max tasks
  let totalMinutes = 0;
  const limitedTasks = [];

  for (const task of sortedTasks) {
    if (limitedTasks.length >= preferences.maxTasksPerDay) break;
    if (totalMinutes + task.estimatedMinutes > preferences.dailyGoalMinutes) break;
    
    limitedTasks.push(task);
    totalMinutes += task.estimatedMinutes;
  }

  return limitedTasks;
};

// Create focus blocks from tasks
export const createFocusBlocks = (
  tasks: DailyTask[],
  preferences: SchedulePreferences,
  date: Date
): FocusBlock[] => {
  const blocks: FocusBlock[] = [];
  const workStart = parseTime(preferences.workingHours.start);
  const workEnd = parseTime(preferences.workingHours.end);
  
  let currentTime = workStart;
  let taskIndex = 0;

  while (currentTime < workEnd && taskIndex < tasks.length) {
    const blockTasks: string[] = [];
    let blockDuration = 0;
    const maxBlockDuration = preferences.preferredFocusBlockDuration;

    // Group tasks into focus blocks
    while (
      taskIndex < tasks.length && 
      blockDuration < maxBlockDuration &&
      blockDuration + tasks[taskIndex].estimatedMinutes <= maxBlockDuration
    ) {
      blockTasks.push(tasks[taskIndex].id);
      blockDuration += tasks[taskIndex].estimatedMinutes;
      taskIndex++;
    }

    if (blockTasks.length > 0) {
      const endTime = addMinutes(currentTime, blockDuration);
      
      blocks.push({
        id: uuidv4(),
        title: `Focus Block ${blocks.length + 1}`,
        startTime: formatTime(currentTime),
        endTime: formatTime(endTime),
        taskIds: blockTasks,
        type: determineFocusBlockType(tasks.filter(t => blockTasks.includes(t.id))),
        description: `Working on ${blockTasks.length} task(s)`
      });

      currentTime = addMinutes(endTime, preferences.breakDuration);
    } else {
      break;
    }
  }

  return blocks;
};

// Helper functions
const parseTime = (timeStr: string): Date => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const formatTime = (date: Date): string => {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const addMinutes = (date: Date, minutes: number): Date => {
  const newDate = new Date(date);
  newDate.setMinutes(newDate.getMinutes() + minutes);
  return newDate;
};

const determineFocusBlockType = (tasks: DailyTask[]): FocusBlock['type'] => {
  const taskTexts = tasks.map(t => t.taskDescription.toLowerCase()).join(' ');
  
  if (taskTexts.includes('practice') || taskTexts.includes('implement') || taskTexts.includes('build')) {
    return 'practice';
  }
  if (taskTexts.includes('study') || taskTexts.includes('learn') || taskTexts.includes('research')) {
    return 'learning';
  }
  if (taskTexts.includes('review') || taskTexts.includes('consolidate')) {
    return 'review';
  }
  
  return 'deep-work';
};

// Generate a complete daily schedule
export const generateDailySchedule = (
  candidateId: string,
  milestones: Milestone[],
  targetDate: Date,
  preferences: SchedulePreferences
): DailySchedule => {
  const tasks = generateDailyTasksFromMilestones(milestones, targetDate, preferences);
  const focusBlocks = createFocusBlocks(tasks, preferences, targetDate);
  
  return {
    id: uuidv4(),
    candidateId,
    date: targetDate,
    tasks,
    totalEstimatedMinutes: tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0),
    completedTasks: 0,
    focusBlocks,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

// Calculate weekly progress
export const calculateWeeklyProgress = (schedules: DailySchedule[]): WeeklyProgress => {
  if (schedules.length === 0) {
    const now = new Date();
    return {
      weekStartDate: getWeekStart(now),
      weekEndDate: getWeekEnd(now),
      totalTasksScheduled: 0,
      totalTasksCompleted: 0,
      totalMinutesScheduled: 0,
      totalMinutesWorked: 0,
      milestoneProgress: [],
      streakDays: 0,
      categoryBreakdown: {}
    };
  }

  const weekStart = getWeekStart(schedules[0].date);
  const weekEnd = getWeekEnd(schedules[0].date);
  
  const totalTasksScheduled = schedules.reduce((sum, schedule) => sum + schedule.tasks.length, 0);
  const totalTasksCompleted = schedules.reduce((sum, schedule) => sum + schedule.completedTasks, 0);
  const totalMinutesScheduled = schedules.reduce((sum, schedule) => sum + schedule.totalEstimatedMinutes, 0);
  
  // Calculate minutes worked (only from completed tasks)
  const totalMinutesWorked = schedules.reduce((sum, schedule) => {
    return sum + schedule.tasks
      .filter(task => task.completed)
      .reduce((taskSum, task) => taskSum + task.estimatedMinutes, 0);
  }, 0);

  // Calculate milestone progress
  const milestoneMap = new Map<string, { title: string, completed: number, total: number }>();
  
  schedules.forEach(schedule => {
    schedule.tasks.forEach(task => {
      if (!milestoneMap.has(task.milestoneId)) {
        milestoneMap.set(task.milestoneId, {
          title: task.milestoneTitle,
          completed: 0,
          total: 0
        });
      }
      
      const milestone = milestoneMap.get(task.milestoneId)!;
      milestone.total++;
      if (task.completed) {
        milestone.completed++;
      }
    });
  });

  const milestoneProgress = Array.from(milestoneMap.entries()).map(([id, data]) => ({
    milestoneId: id,
    milestoneTitle: data.title,
    tasksCompleted: data.completed,
    totalTasks: data.total,
    progressPercentage: Math.round((data.completed / data.total) * 100)
  }));

  // Calculate streak days
  const streakDays = calculateStreakDays(schedules);

  // Calculate category breakdown
  const categoryBreakdown: WeeklyProgress['categoryBreakdown'] = {};
  schedules.forEach(schedule => {
    schedule.tasks.forEach(task => {
      if (!categoryBreakdown[task.category]) {
        categoryBreakdown[task.category] = {
          tasksCompleted: 0,
          minutesWorked: 0
        };
      }
      
      if (task.completed) {
        categoryBreakdown[task.category]!.tasksCompleted++;
        categoryBreakdown[task.category]!.minutesWorked += task.estimatedMinutes;
      }
    });
  });

  return {
    weekStartDate: weekStart,
    weekEndDate: weekEnd,
    totalTasksScheduled,
    totalTasksCompleted,
    totalMinutesScheduled,
    totalMinutesWorked,
    milestoneProgress,
    streakDays,
    categoryBreakdown
  };
};

// Helper functions for date calculations
const getWeekStart = (date: Date): Date => {
  const start = new Date(date);
  const diff = start.getDate() - start.getDay();
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
};

const getWeekEnd = (date: Date): Date => {
  const end = new Date(getWeekStart(date));
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

const calculateStreakDays = (schedules: DailySchedule[]): number => {
  const sortedSchedules = schedules
    .filter(s => s.completedTasks > 0)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
    
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  for (const schedule of sortedSchedules) {
    const scheduleDate = new Date(schedule.date);
    scheduleDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.round((currentDate.getTime() - scheduleDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === streak) {
      streak++;
      currentDate = scheduleDate;
    } else {
      break;
    }
  }
  
  return streak;
};

// Task completion utilities
export const completeTask = (task: DailyTask, notes?: string): DailyTask => {
  return {
    ...task,
    completed: true,
    completedAt: new Date(),
    notes: notes || task.notes
  };
};

export const deferTask = (task: DailyTask, newDate: Date, reason: string): DailyTask => {
  return {
    ...task,
    deferredTo: newDate,
    deferralReason: reason
  };
};

// Get suggested next tasks based on completion patterns
export const getSuggestedNextTasks = (
  completedTasks: DailyTask[],
  milestones: Milestone[]
): DailyTask[] => {
  // Analyze completion patterns and suggest relevant next tasks
  const categoryFrequency = completedTasks.reduce((acc, task) => {
    acc[task.category] = (acc[task.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Find the most worked-on category
  const topCategory = Object.entries(categoryFrequency)
    .sort(([,a], [,b]) => b - a)[0]?.[0] as MilestoneCategory;

  if (!topCategory) return [];

  // Find milestones in the same category that need more work
  const relevantMilestones = milestones.filter(m => 
    m.category === topCategory && 
    !m.completed &&
    m.tasks?.some(t => !t.completed)
  );

  return generateDailyTasksFromMilestones(
    relevantMilestones.slice(0, 2),
    new Date(),
    DEFAULT_SCHEDULE_PREFERENCES
  );
}; 