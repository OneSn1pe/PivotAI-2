'use client';

import React, { useState, useEffect } from 'react';
import { 
  DailySchedule, 
  DailyTask, 
  FocusBlock, 
  WeeklyProgress,
  SchedulePreferences,
  MilestoneCategory 
} from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';

interface DailyTaskManagerProps {
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
}

const DailyTaskManager: React.FC<DailyTaskManagerProps> = ({ 
  selectedDate = new Date(), 
  onDateChange 
}) => {
  const { userProfile } = useAuth();
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const [dailySchedule, setDailySchedule] = useState<DailySchedule | null>(null);
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'today' | 'weekly' | 'settings'>('today');
  const [showSettings, setShowSettings] = useState(false);

  // Load daily schedule and weekly progress
  useEffect(() => {
    if (userProfile?.uid) {
      loadDailyData();
    }
  }, [userProfile?.uid, currentDate]);

  const loadDailyData = async () => {
    if (!userProfile?.uid) return;
    
    setLoading(true);
    setError(null);

    try {
      // Load daily schedule
      const dailyResponse = await fetch(
        `/api/daily-schedule?candidateId=${userProfile.uid}&date=${currentDate.toISOString().split('T')[0]}`
      );
      
      if (dailyResponse.ok) {
        const dailyData = await dailyResponse.json();
        if (dailyData) {
          setDailySchedule({
            ...dailyData,
            date: new Date(dailyData.date),
            createdAt: new Date(dailyData.createdAt),
            updatedAt: new Date(dailyData.updatedAt),
            tasks: dailyData.tasks?.map((task: any) => ({
              ...task,
              scheduledDate: new Date(task.scheduledDate),
              completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
              deferredTo: task.deferredTo ? new Date(task.deferredTo) : undefined
            })) || []
          });
        } else {
          setDailySchedule(null);
        }
      }

      // Load weekly progress
      const weeklyResponse = await fetch(
        `/api/daily-schedule?candidateId=${userProfile.uid}&date=${currentDate.toISOString().split('T')[0]}&type=weekly`
      );
      
      if (weeklyResponse.ok) {
        const weeklyData = await weeklyResponse.json();
        setWeeklyProgress({
          ...weeklyData,
          weekStartDate: new Date(weeklyData.weekStartDate),
          weekEndDate: new Date(weeklyData.weekEndDate)
        });
      }
    } catch (err) {
      console.error('Error loading daily data:', err);
      setError('Failed to load schedule data');
    } finally {
      setLoading(false);
    }
  };

  const generateSchedule = async () => {
    if (!userProfile?.uid) return;

    setLoading(true);
    try {
      const response = await fetch('/api/daily-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: userProfile.uid,
          date: currentDate.toISOString().split('T')[0],
          regenerate: true
        })
      });

      if (response.ok) {
        await loadDailyData();
      } else {
        setError('Failed to generate schedule');
      }
    } catch (err) {
      console.error('Error generating schedule:', err);
      setError('Failed to generate schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string, notes?: string) => {
    if (!dailySchedule) return;

    try {
      const response = await fetch('/api/daily-schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId: dailySchedule.id,
          action: 'complete-task',
          taskUpdates: { taskId, notes }
        })
      });

      if (response.ok) {
        const updatedSchedule = await response.json();
        setDailySchedule({
          ...updatedSchedule,
          date: new Date(updatedSchedule.date),
          createdAt: new Date(updatedSchedule.createdAt),
          updatedAt: new Date(updatedSchedule.updatedAt),
          tasks: updatedSchedule.tasks?.map((task: any) => ({
            ...task,
            scheduledDate: new Date(task.scheduledDate),
            completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
            deferredTo: task.deferredTo ? new Date(task.deferredTo) : undefined
          })) || []
        });
      }
    } catch (err) {
      console.error('Error completing task:', err);
      setError('Failed to complete task');
    }
  };

  const handleDeferTask = async (taskId: string, newDate: Date, reason: string) => {
    if (!dailySchedule) return;

    try {
      const response = await fetch('/api/daily-schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId: dailySchedule.id,
          action: 'defer-task',
          taskUpdates: { taskId, newDate: newDate.toISOString(), reason }
        })
      });

      if (response.ok) {
        await loadDailyData();
      }
    } catch (err) {
      console.error('Error deferring task:', err);
      setError('Failed to defer task');
    }
  };

  const handleDateChange = (newDate: Date) => {
    setCurrentDate(newDate);
    onDateChange?.(newDate);
  };

  const getCategoryColor = (category: MilestoneCategory): string => {
    const colors = {
      technical: 'bg-blue-100 text-blue-800 border-blue-200',
      fundamental: 'bg-green-100 text-green-800 border-green-200',
      niche: 'bg-purple-100 text-purple-800 border-purple-200',
      soft: 'bg-orange-100 text-orange-800 border-orange-200',
      // Engineering
      design: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      analysis: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      implementation: 'bg-blue-100 text-blue-800 border-blue-200',
      safety: 'bg-red-100 text-red-800 border-red-200',
      regulatory: 'bg-gray-100 text-gray-800 border-gray-200',
      // Medicine
      clinical: 'bg-pink-100 text-pink-800 border-pink-200',
      research: 'bg-violet-100 text-violet-800 border-violet-200',
      'patient-care': 'bg-rose-100 text-rose-800 border-rose-200',
      diagnostic: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      compliance: 'bg-slate-100 text-slate-800 border-slate-200',
      // Business
      strategy: 'bg-amber-100 text-amber-800 border-amber-200',
      operations: 'bg-lime-100 text-lime-800 border-lime-200',
      finance: 'bg-green-100 text-green-800 border-green-200',
      leadership: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'market-analysis': 'bg-teal-100 text-teal-800 border-teal-200',
      // Law
      litigation: 'bg-red-100 text-red-800 border-red-200',
      advisory: 'bg-blue-100 text-blue-800 border-blue-200',
      negotiation: 'bg-purple-100 text-purple-800 border-purple-200'
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Daily Task Manager</h1>
          <p className="text-slate-600 mt-1">Organize your milestone progress with intelligent daily planning</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="date"
            value={currentDate.toISOString().split('T')[0]}
            onChange={(e) => handleDateChange(new Date(e.target.value))}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          <button
            onClick={generateSchedule}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Generate Schedule
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'today', label: 'Today\'s Schedule', icon: '📅' },
            { key: 'weekly', label: 'Weekly Progress', icon: '📊' },
            { key: 'settings', label: 'Preferences', icon: '⚙️' }
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
                {dailySchedule && (
                  <div className="text-sm text-slate-600">
                    {dailySchedule.completedTasks} of {dailySchedule.tasks.length} completed
                  </div>
                )}
              </div>

              {!dailySchedule ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-lg font-medium text-slate-800 mb-2">No Schedule Generated</h3>
                  <p className="text-slate-600 mb-4">Generate your daily schedule to see personalized tasks based on your milestones.</p>
                  <button
                    onClick={generateSchedule}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium"
                  >
                    Generate Today's Schedule
                  </button>
                </div>
              ) : dailySchedule.tasks.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-lg font-medium text-slate-800 mb-2">All Caught Up!</h3>
                  <p className="text-slate-600">You don't have any pending tasks for today.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dailySchedule.tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onComplete={(notes) => handleCompleteTask(task.id, notes)}
                      onDefer={(newDate, reason) => handleDeferTask(task.id, newDate, reason)}
                      getCategoryColor={getCategoryColor}
                      getPriorityColor={getPriorityColor}
                      formatDuration={formatDuration}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Focus Blocks & Summary */}
          <div className="space-y-4">
            {/* Daily Summary */}
            {dailySchedule && (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Daily Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Total Time</span>
                    <span className="font-medium">{formatDuration(dailySchedule.totalEstimatedMinutes)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Tasks</span>
                    <span className="font-medium">{dailySchedule.tasks.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Progress</span>
                    <span className="font-medium">
                      {Math.round((dailySchedule.completedTasks / dailySchedule.tasks.length) * 100)}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(dailySchedule.completedTasks / dailySchedule.tasks.length) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Focus Blocks */}
            {dailySchedule?.focusBlocks && dailySchedule.focusBlocks.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Focus Blocks</h3>
                <div className="space-y-3">
                  {dailySchedule.focusBlocks.map((block) => (
                    <FocusBlockCard
                      key={block.id}
                      block={block}
                      tasks={dailySchedule.tasks.filter(t => block.taskIds.includes(t.id))}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Weekly Progress Tab */}
      {activeTab === 'weekly' && weeklyProgress && (
        <WeeklyProgressView progress={weeklyProgress} />
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <SchedulePreferencesView />
      )}
    </div>
  );
};

// Task Card Component
interface TaskCardProps {
  task: DailyTask;
  onComplete: (notes?: string) => void;
  onDefer: (newDate: Date, reason: string) => void;
  getCategoryColor: (category: MilestoneCategory) => string;
  getPriorityColor: (priority: DailyTask['priority']) => string;
  formatDuration: (minutes: number) => string;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onComplete,
  onDefer,
  getCategoryColor,
  getPriorityColor,
  formatDuration
}) => {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(task.notes || '');
  const [showDeferModal, setShowDeferModal] = useState(false);

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
            <button
              onClick={() => setShowDeferModal(true)}
              className="text-slate-400 hover:text-slate-600 p-1"
              title="Defer task"
            >
              ⏰
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

      {/* Defer Modal */}
      {showDeferModal && (
        <DeferTaskModal
          task={task}
          onDefer={onDefer}
          onCancel={() => setShowDeferModal(false)}
        />
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
      {progress.milestoneProgress.length > 0 && (
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
      )}

      {/* Category Breakdown */}
      {Object.keys(progress.categoryBreakdown).length > 0 && (
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
      )}
    </div>
  );
};

// Schedule Preferences View Component
const SchedulePreferencesView: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-semibold text-slate-800 mb-4">Schedule Preferences</h2>
      <div className="text-center py-8">
        <div className="text-6xl mb-4">⚙️</div>
        <h3 className="text-lg font-medium text-slate-800 mb-2">Coming Soon</h3>
        <p className="text-slate-600">
          Customize your daily schedule preferences, working hours, and task distribution settings.
        </p>
      </div>
    </div>
  );
};

// Defer Task Modal Component
interface DeferTaskModalProps {
  task: DailyTask;
  onDefer: (newDate: Date, reason: string) => void;
  onCancel: () => void;
}

const DeferTaskModal: React.FC<DeferTaskModalProps> = ({ task, onDefer, onCancel }) => {
  const [newDate, setNewDate] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onDefer(new Date(newDate), reason);
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Defer Task</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              New Date
            </label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Reason (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you deferring this task?"
              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
            >
              Defer Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DailyTaskManager; 