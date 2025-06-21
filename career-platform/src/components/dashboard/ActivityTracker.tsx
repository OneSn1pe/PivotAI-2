import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ProgressTrackingService } from '@/services/progressTracking';

interface ActivityStats {
  totalActiveDays: number;
  milestonesCompleted: number;
}

interface ActivityTrackerProps {
  userId: string;
  className?: string;
}

export function ActivityTracker({ userId, className = '' }: ActivityTrackerProps) {
  const [stats, setStats] = useState<ActivityStats>({
    totalActiveDays: 0,
    milestonesCompleted: 0,
  });
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState(30); // days

  useEffect(() => {
    loadActivityStats();
  }, [userId, timeframe]);

  const loadActivityStats = async () => {
    try {
      setLoading(true);
      const activityStats = await ProgressTrackingService.getActivityStats(userId, timeframe);
      setStats(activityStats);
    } catch (error) {
      console.error('Error loading activity stats:', error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Activity</h3>
        <div className="flex gap-1">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setTimeframe(days)}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                timeframe === days
                  ? 'text-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {days}D
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-12 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-baseline pb-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">Active Days</span>
              <span className="text-lg font-medium text-gray-900">
                {stats.totalActiveDays}/{timeframe}
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="flex justify-between items-baseline pb-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">Milestones</span>
              <span className="text-lg font-medium text-gray-900">
                {stats.milestonesCompleted}
              </span>
            </div>
          </motion.div>

        </div>
      )}
    </div>
  );
}