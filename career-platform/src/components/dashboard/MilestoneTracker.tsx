import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight } from 'lucide-react';
import { ProgressTrackingService } from '@/services/progressTracking';
import { Milestone } from '@/types/user';
import { toast } from 'sonner';

interface MilestoneTrackerProps {
  userId: string;
  milestones: Milestone[];
  completedMilestones: string[];
  onMilestoneComplete?: (milestoneId: string) => void;
  className?: string;
}

export function MilestoneTracker({
  userId,
  milestones,
  completedMilestones,
  onMilestoneComplete,
  className = '',
}: MilestoneTrackerProps) {
  const [completing, setCompleting] = useState<string | null>(null);
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);

  const handleCompleteMilestone = async (milestone: Milestone) => {
    if (completing || completedMilestones.includes(milestone.id)) return;

    try {
      setCompleting(milestone.id);
      
      const result = await ProgressTrackingService.completeMilestone(
        userId,
        milestone.id,
        false,
        milestone.level
      );

      if (result.achievement) {
        toast.success(`Achievement unlocked: ${result.achievement.title}`);
      } else {
        toast.success('Milestone completed!');
      }

      onMilestoneComplete?.(milestone.id);
    } catch (error) {
      console.error('Error completing milestone:', error);
      toast.error('Failed to complete milestone');
    } finally {
      setCompleting(null);
    }
  };

  const getMilestoneStatus = (milestone: Milestone) => {
    if (completedMilestones.includes(milestone.id)) return 'completed';
    return 'available';
  };

  const sortedMilestones = [...milestones].sort((a, b) => {
    const aStatus = getMilestoneStatus(a);
    const bStatus = getMilestoneStatus(b);
    
    if (aStatus === 'completed' && bStatus !== 'completed') return 1;
    if (aStatus !== 'completed' && bStatus === 'completed') return -1;
    return 0;
  });

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Milestones</h3>
        <p className="text-sm text-gray-500 mt-1">
          {completedMilestones.length}/{milestones.length} completed
        </p>
      </div>

      {/* Minimalist Progress */}
      <div className="mb-6">
        <div className="h-1 bg-gray-100 rounded-sm">
          <motion.div
            className="h-full bg-gray-900 rounded-sm"
            initial={{ width: 0 }}
            animate={{ 
              width: `${(completedMilestones.length / milestones.length) * 100}%` 
            }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Milestone list */}
      <div className="space-y-2">
        <AnimatePresence>
          {sortedMilestones.slice(0, 5).map((milestone, index) => {
            const status = getMilestoneStatus(milestone);
            const isExpanded = expandedMilestone === milestone.id;
            const isCompleting = completing === milestone.id;

            return (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group"
              >
                <div
                  className={`p-4 cursor-pointer transition-colors ${
                    status === 'completed'
                      ? 'bg-gray-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setExpandedMilestone(isExpanded ? null : milestone.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        status === 'completed'
                          ? 'border-gray-900 bg-gray-900'
                          : 'border-gray-300'
                      }`}>
                        {status === 'completed' && (
                          <Check className="w-2.5 h-2.5 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className={`text-sm font-medium ${
                          status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'
                        }`}>
                          {milestone.title}
                        </h4>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 text-gray-400 transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && status === 'available' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-2">
                        <p className="text-sm text-gray-600 mb-3">
                          {milestone.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Complete to unlock
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompleteMilestone(milestone);
                            }}
                            disabled={isCompleting}
                            className="px-3 py-1 text-xs font-medium bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {isCompleting ? 'Completing...' : 'Complete'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {milestones.length > 5 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            View all {milestones.length} milestones →
          </button>
        </div>
      )}
    </div>
  );
}