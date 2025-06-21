'use client';

import React, { useEffect, useState } from 'react';
import { UserProgress } from '@/types/user';

interface ProgressVisualizationsProps {
  userProgress: UserProgress;
  className?: string;
}

export function CircularProgress({ 
  value, 
  maxValue, 
  size = 120, 
  strokeWidth = 8,
  label,
  sublabel 
}: { 
  value: number; 
  maxValue: number; 
  size?: number; 
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
}) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = (animatedValue / maxValue) * 100;
  const offset = circumference - (progress / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#374151"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold text-gray-900">{animatedValue}</span>
        {label && <span className="text-xs text-gray-600">{label}</span>}
      </div>
      {sublabel && <span className="text-sm text-gray-600 mt-2">{sublabel}</span>}
    </div>
  );
}

export function ProgressRadialChart({ userProgress }: { userProgress: UserProgress }) {
  const totalMilestones = Object.values(userProgress.completedMilestones).length;
  const totalMicros = Object.values(userProgress.completedMicroMilestones || {}).length;
  const totalAchievements = userProgress.achievements?.length || 0;

  return (
    <div className="grid grid-cols-3 gap-8 justify-items-center py-8">
      <CircularProgress 
        value={totalMilestones} 
        maxValue={50} 
        label="of 50"
        sublabel="Milestones"
      />
      <CircularProgress 
        value={totalMicros} 
        maxValue={100} 
        label="of 100"
        sublabel="Micro-tasks"
      />
      <CircularProgress 
        value={totalAchievements} 
        maxValue={30} 
        label="of 30"
        sublabel="Achievements"
      />
    </div>
  );
}

export function StreakVisualizer({ streakDays }: { streakDays: number }) {
  const days = Array.from({ length: 30 }, (_, i) => i);
  const today = new Date().getDay();

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline mb-2">
        <h4 className="text-sm font-medium text-gray-900">Activity Streak</h4>
        <span className="text-xs text-gray-600">{streakDays} day streak</span>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isActive = day < streakDays;
          const isToday = day === today;
          return (
            <div
              key={day}
              className={`
                h-8 rounded
                transition-all duration-300
                ${isActive ? 'bg-gray-900' : 'bg-gray-100'}
                ${isToday ? 'ring-2 ring-gray-400 ring-offset-1' : ''}
              `}
              style={{
                animationDelay: `${day * 50}ms`,
              }}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>30 days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}


export function MilestoneTimeline({ milestones }: { milestones: any[] }) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
      {milestones.slice(0, 5).map((milestone, index) => (
        <div 
          key={milestone.id} 
          className="relative flex items-center mb-6 last:mb-0"
          style={{
            animationDelay: `${index * 100}ms`,
          }}
        >
          <div className={`
            absolute left-0 w-8 h-8 rounded-full flex items-center justify-center
            ${milestone.completed ? 'bg-gray-900 text-white' : 'bg-white border-2 border-gray-300'}
            transition-all duration-300
          `}>
            {milestone.completed ? '✓' : index + 1}
          </div>
          <div className="ml-12">
            <h5 className={`text-sm font-medium ${milestone.completed ? 'text-gray-900' : 'text-gray-600'}`}>
              {milestone.title}
            </h5>
            <p className="text-xs text-gray-500 mt-1">{milestone.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}