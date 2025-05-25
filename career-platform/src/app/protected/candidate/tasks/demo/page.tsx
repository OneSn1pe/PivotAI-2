'use client';

import React, { useState } from 'react';
import { 
  DailySchedule, 
  DailyTask, 
  FocusBlock, 
  WeeklyProgress, 
  MilestoneCategory,
  ProfessionalField 
} from '@/types/user';

// Sample data for demonstration
const sampleTasks: DailyTask[] = [
  {
    id: 'task-1',
    milestoneId: 'milestone-tech-1',
    milestoneTitle: 'Master React Advanced Patterns',
    taskDescription: 'Study React Hooks patterns and custom hook implementation',
    scheduledDate: new Date(),
    estimatedMinutes: 90,
    priority: 'high',
    category: 'technical',
    professionalField: 'computer-science',
    completed: false,
    resourceLinks: [
      'https://react.dev/learn/reusing-logic-with-custom-hooks',
      'https://usehooks.com/'
    ],
    tags: ['react', 'hooks', 'patterns']
  },
  {
    id: 'task-2',
    milestoneId: 'milestone-fund-1',
    milestoneTitle: 'System Design Fundamentals',
    taskDescription: 'Review database design principles and normalization',
    scheduledDate: new Date(),
    estimatedMinutes: 60,
    priority: 'critical',
    category: 'fundamental',
    professionalField: 'computer-science',
    completed: true,
    completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    notes: 'Completed reading on database normalization. Good understanding of 1NF, 2NF, 3NF.',
    resourceLinks: ['https://github.com/donnemartin/system-design-primer'],
    tags: ['database', 'system-design', 'fundamentals']
  },
  {
    id: 'task-3',
    milestoneId: 'milestone-niche-1',
    milestoneTitle: 'AI/ML Fundamentals',
    taskDescription: 'Practice implementing linear regression from scratch',
    scheduledDate: new Date(),
    estimatedMinutes: 120,
    priority: 'medium',
    category: 'niche',
    professionalField: 'computer-science',
    completed: false,
    resourceLinks: ['https://www.coursera.org/learn/machine-learning'],
    tags: ['machine-learning', 'algorithms', 'python']
  },
  {
    id: 'task-4',
    milestoneId: 'milestone-soft-1',
    milestoneTitle: 'Technical Communication',
    taskDescription: 'Practice explaining technical concepts to non-technical stakeholders',
    scheduledDate: new Date(),
    estimatedMinutes: 45,
    priority: 'medium',
    category: 'soft',
    professionalField: 'computer-science',
    completed: false,
    resourceLinks: ['https://www.toastmasters.org/'],
    tags: ['communication', 'presentation', 'leadership']
  },
  {
    id: 'task-5',
    milestoneId: 'milestone-tech-2',
    milestoneTitle: 'Advanced TypeScript',
    taskDescription: 'Learn about advanced TypeScript utility types and generics',
    scheduledDate: new Date(),
    estimatedMinutes: 75,
    priority: 'high',
    category: 'technical',
    professionalField: 'computer-science',
    completed: false,
    resourceLinks: [
      'https://www.typescriptlang.org/docs/handbook/utility-types.html',
      'https://www.typescriptlang.org/docs/handbook/2/generics.html'
    ],
    tags: ['typescript', 'generics', 'types']
  }
];

const sampleFocusBlocks: FocusBlock[] = [
  {
    id: 'block-1',
    title: 'Morning Deep Work',
    startTime: '09:00',
    endTime: '10:30',
    taskIds: ['task-1', 'task-5'],
    type: 'deep-work',
    description: 'Focus on technical learning and implementation'
  },
  {
    id: 'block-2',
    title: 'Mid-Morning Learning',
    startTime: '11:00',
    endTime: '12:00',
    taskIds: ['task-3'],
    type: 'learning',
    description: 'Machine learning practice and theory'
  },
  {
    id: 'block-3',
    title: 'Afternoon Skills Practice',
    startTime: '14:00',
    endTime: '14:45',
    taskIds: ['task-4'],
    type: 'practice',
    description: 'Communication and soft skills development'
  }
];

const sampleDailySchedule: DailySchedule = {
  id: 'schedule-demo',
  candidateId: 'demo-user',
  date: new Date(),
  tasks: sampleTasks,
  totalEstimatedMinutes: 390,
  completedTasks: 1,
  focusBlocks: sampleFocusBlocks,
  createdAt: new Date(),
  updatedAt: new Date()
};

const sampleWeeklyProgress: WeeklyProgress = {
  weekStartDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
  weekEndDate: new Date(),
  totalTasksScheduled: 28,
  totalTasksCompleted: 19,
  totalMinutesScheduled: 1680, // 28 hours
  totalMinutesWorked: 1140, // 19 hours
  streakDays: 4,
  milestoneProgress: [
    {
      milestoneId: 'milestone-tech-1',
      milestoneTitle: 'Master React Advanced Patterns',
      tasksCompleted: 6,
      totalTasks: 8,
      progressPercentage: 75
    },
    {
      milestoneId: 'milestone-fund-1',
      milestoneTitle: 'System Design Fundamentals',
      tasksCompleted: 4,
      totalTasks: 6,
      progressPercentage: 67
    },
    {
      milestoneId: 'milestone-niche-1',
      milestoneTitle: 'AI/ML Fundamentals',
      tasksCompleted: 3,
      totalTasks: 7,
      progressPercentage: 43
    },
    {
      milestoneId: 'milestone-soft-1',
      milestoneTitle: 'Technical Communication',
      tasksCompleted: 6,
      totalTasks: 7,
      progressPercentage: 86
    }
  ],
  categoryBreakdown: {
    technical: {
      tasksCompleted: 8,
      minutesWorked: 480
    },
    fundamental: {
      tasksCompleted: 4,
      minutesWorked: 240
    },
    niche: {
      tasksCompleted: 3,
      minutesWorked: 300
    },
    soft: {
      tasksCompleted: 4,
      minutesWorked: 120
    }
  }
};

export default function DailyTasksDemo() {
  const [schedule, setSchedule] = useState<DailySchedule>(sampleDailySchedule);
  const [activeTab, setActiveTab] = useState<'today' | 'weekly' | 'settings'>('today');

  const handleCompleteTask = (taskId: string, notes?: string) => {
    setSchedule(prev => ({
      ...prev,
      tasks: prev.tasks.map(task => 
        task.id === taskId 
          ? { ...task, completed: true, completedAt: new Date(), notes: notes || task.notes }
          : task
      ),
      completedTasks: prev.tasks.filter(t => t.id === taskId || t.completed).length
    }));
  };

  const getCategoryColor = (category: MilestoneCategory): string => {
    const colors = {
      technical: 'bg-blue-100 text-blue-800 border-blue-200',
      fundamental: 'bg-green-100 text-green-800 border-green-200',
      niche: 'bg-purple-100 text-purple-800 border-purple-200',
      soft: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityColor = (priority: DailyTask['priority']): string => {
    const colors = {
      critical: 'border-l-red-500 bg-red-50',
      high: 'border-l-orange-500 bg-orange-50',
      medium: 'border-l-yellow-500 bg-yellow-50',
      low: 'border-l-green-500 bg-green-50'
    };
    return colors[priority];
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Daily Task Manager - Demo</h1>
              <p className="text-slate-600 mt-1">Experience intelligent daily planning with sample data</p>
            </div>
            <div className="flex gap-3">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                📺 Demo Mode
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Tab Navigation */}
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'today', label: 'Today\'s Schedule', icon: '📅' },
              { key: 'weekly', label: 'Weekly Progress', icon: '📊' },
              { key: 'settings', label: 'Features', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Today's Schedule Tab */}
        {activeTab === 'today' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily Tasks */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-slate-800">Today's Tasks</h2>
                  <div className="text-sm text-slate-600">
                    {schedule.completedTasks} of {schedule.tasks.length} completed
                  </div>
                </div>

                <div className="space-y-3">
                  {schedule.tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onComplete={(notes) => handleCompleteTask(task.id, notes)}
                      getCategoryColor={getCategoryColor}
                      getPriorityColor={getPriorityColor}
                      formatDuration={formatDuration}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Focus Blocks & Summary */}
            <div className="space-y-4">
              {/* Daily Summary */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Daily Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Total Time</span>
                    <span className="font-medium">{formatDuration(schedule.totalEstimatedMinutes)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Tasks</span>
                    <span className="font-medium">{schedule.tasks.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Progress</span>
                    <span className="font-medium">
                      {Math.round((schedule.completedTasks / schedule.tasks.length) * 100)}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(schedule.completedTasks / schedule.tasks.length) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Focus Blocks */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Focus Blocks</h3>
                <div className="space-y-3">
                  {schedule.focusBlocks.map((block) => (
                    <FocusBlockCard
                      key={block.id}
                      block={block}
                      tasks={schedule.tasks.filter(t => block.taskIds.includes(t.id))}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Weekly Progress Tab */}
        {activeTab === 'weekly' && (
          <WeeklyProgressView progress={sampleWeeklyProgress} />
        )}

        {/* Features Tab */}
        {activeTab === 'settings' && (
          <FeaturesView />
        )}
      </div>
    </div>
  );
}

// Task Card Component (Demo version)
interface TaskCardProps {
  task: DailyTask;
  onComplete: (notes?: string) => void;
  getCategoryColor: (category: MilestoneCategory) => string;
  getPriorityColor: (priority: DailyTask['priority']) => string;
  formatDuration: (minutes: number) => string;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onComplete,
  getCategoryColor,
  getPriorityColor,
  formatDuration
}) => {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(task.notes || '');

  return (
    <div
      className={`border-l-4 rounded-lg p-4 transition-all duration-200 ${
        task.completed 
          ? 'bg-green-50 border-l-green-500 opacity-75' 
          : `${getPriorityColor(task.priority)} hover:shadow-md`
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => !task.completed && onComplete(notes)}
              disabled={task.completed}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                task.completed
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-slate-300 hover:border-teal-500'
              }`}
            >
              {task.completed && '✓'}
            </button>
            <span className={`text-sm px-2 py-1 rounded border ${getCategoryColor(task.category)}`}>
              {task.category}
            </span>
            <span className="text-sm text-slate-500">{formatDuration(task.estimatedMinutes)}</span>
          </div>
          
          <h4 className={`font-medium mb-1 ${task.completed ? 'line-through text-slate-500' : 'text-slate-800'}`}>
            {task.taskDescription}
          </h4>
          
          <p className="text-sm text-slate-600 mb-2">
            From: <span className="font-medium">{task.milestoneTitle}</span>
          </p>

          {task.notes && (
            <p className="text-sm text-slate-600 italic">
              Notes: {task.notes}
            </p>
          )}

          {task.resourceLinks && task.resourceLinks.length > 0 && (
            <div className="mt-2">
              <details className="text-sm">
                <summary className="cursor-pointer text-teal-600 hover:text-teal-700">
                  Resources ({task.resourceLinks.length})
                </summary>
                <div className="mt-1 space-y-1">
                  {task.resourceLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-teal-600 hover:text-teal-700 hover:underline"
                    >
                      🔗 Resource {index + 1}
                    </a>
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>

        {!task.completed && (
          <div className="flex gap-2 ml-4">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="text-slate-400 hover:text-slate-600 p-1"
              title="Add notes"
            >
              📝
            </button>
          </div>
        )}
      </div>

      {/* Notes Section */}
      {showNotes && !task.completed && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this task..."
            className="w-full p-2 text-sm border border-slate-300 rounded resize-none"
            rows={2}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setShowNotes(false)}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onComplete(notes);
                setShowNotes(false);
              }}
              className="text-xs bg-teal-600 text-white px-3 py-1 rounded hover:bg-teal-700"
            >
              Complete with Notes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Focus Block Card Component
interface FocusBlockCardProps {
  block: FocusBlock;
  tasks: DailyTask[];
}

const FocusBlockCard: React.FC<FocusBlockCardProps> = ({ block, tasks }) => {
  const getTypeIcon = (type: FocusBlock['type']): string => {
    const icons = {
      'deep-work': '🧠',
      'learning': '📚',
      'practice': '🛠️',
      'review': '🔍',
      'break': '☕'
    };
    return icons[type];
  };

  const getTypeColor = (type: FocusBlock['type']): string => {
    const colors = {
      'deep-work': 'bg-purple-100 text-purple-800 border-purple-200',
      'learning': 'bg-blue-100 text-blue-800 border-blue-200',
      'practice': 'bg-green-100 text-green-800 border-green-200',
      'review': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'break': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[type];
  };

  return (
    <div className="border border-slate-200 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getTypeIcon(block.type)}</span>
          <span className="font-medium text-slate-800">{block.title}</span>
        </div>
        <span className="text-sm text-slate-600">
          {block.startTime} - {block.endTime}
        </span>
      </div>
      
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs px-2 py-1 rounded border ${getTypeColor(block.type)}`}>
          {block.type}
        </span>
        <span className="text-xs text-slate-500">
          {tasks.length} task{tasks.length !== 1 ? 's' : ''}
        </span>
      </div>

      {block.description && (
        <p className="text-sm text-slate-600">{block.description}</p>
      )}
    </div>
  );
};

// Weekly Progress View Component
interface WeeklyProgressViewProps {
  progress: WeeklyProgress;
}

const WeeklyProgressView: React.FC<WeeklyProgressViewProps> = ({ progress }) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const completionRate = progress.totalTasksScheduled > 0 
    ? Math.round((progress.totalTasksCompleted / progress.totalTasksScheduled) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Week Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-800">Week Overview</h2>
          <span className="text-sm text-slate-600">
            {formatDate(progress.weekStartDate)} - {formatDate(progress.weekEndDate)}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-teal-600">{progress.totalTasksCompleted}</div>
            <div className="text-sm text-slate-600">Tasks Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{Math.round(progress.totalMinutesWorked / 60)}h</div>
            <div className="text-sm text-slate-600">Hours Worked</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{completionRate}%</div>
            <div className="text-sm text-slate-600">Completion Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{progress.streakDays}</div>
            <div className="text-sm text-slate-600">Day Streak</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-slate-600 mb-2">
            <span>Weekly Progress</span>
            <span>{progress.totalTasksCompleted} / {progress.totalTasksScheduled} tasks</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-teal-500 to-teal-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Milestone Progress */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Milestone Progress</h3>
        <div className="space-y-4">
          {progress.milestoneProgress.map((milestone) => (
            <div key={milestone.milestoneId} className="border border-slate-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-slate-800">{milestone.milestoneTitle}</h4>
                <span className="text-sm font-medium text-slate-600">
                  {milestone.progressPercentage}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                <div
                  className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${milestone.progressPercentage}%` }}
                ></div>
              </div>
              <div className="text-sm text-slate-600">
                {milestone.tasksCompleted} of {milestone.totalTasks} tasks completed
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Category Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(progress.categoryBreakdown).map(([category, data]) => (
            <div key={category} className="border border-slate-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-slate-800 capitalize">{category}</span>
                <span className="text-sm text-slate-600">
                  {Math.round(data.minutesWorked / 60)}h {data.minutesWorked % 60}m
                </span>
              </div>
              <div className="text-sm text-slate-600">
                {data.tasksCompleted} tasks completed
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Features View Component
const FeaturesView: React.FC = () => {
  const features = [
    {
      icon: '🤖',
      title: 'AI-Powered Task Generation',
      description: 'Automatically breaks down complex milestones into manageable daily tasks using intelligent algorithms.'
    },
    {
      icon: '📅',
      title: 'Smart Scheduling',
      description: 'Creates optimized daily schedules based on your preferences, priorities, and available time.'
    },
    {
      icon: '🎯',
      title: 'Focus Blocks',
      description: 'Groups related tasks into time-blocked sessions for maximum productivity and deep work.'
    },
    {
      icon: '📊',
      title: 'Progress Tracking',
      description: 'Monitor your weekly progress with detailed analytics and milestone completion rates.'
    },
    {
      icon: '🏆',
      title: 'Category-Based Organization',
      description: 'Tasks are categorized as Technical, Fundamental, Niche, or Soft Skills for balanced development.'
    },
    {
      icon: '⚡',
      title: 'Adaptive Learning',
      description: 'System learns from your completion patterns to suggest better scheduling and task prioritization.'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Daily Task Manager Features</h2>
        <p className="text-slate-600 mb-6">
          This intelligent task management system transforms your career milestones into actionable daily plans.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{feature.icon}</span>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-600">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">🚀 Try it in your actual dashboard!</h3>
          <p className="text-blue-700 text-sm">
            This demo shows sample data. In your real dashboard, tasks will be generated from your actual milestones 
            and career roadmap, providing personalized daily schedules tailored to your professional goals.
          </p>
        </div>
      </div>
    </div>
  );
}; 