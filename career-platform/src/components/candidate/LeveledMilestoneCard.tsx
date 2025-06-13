'use client';

import React, { useState } from 'react';
import { Milestone, UserProgress, MicroMilestone } from '@/types/user';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Lock, 
  CheckCircle, 
  Circle, 
  ChevronDown,
  ChevronUp,
  Clock
} from 'lucide-react';

interface LeveledMilestoneCardProps {
  milestone: Milestone;
  userProgress?: UserProgress;
  onComplete?: (milestoneId: string) => void;
  onMicroComplete?: (microId: string) => void;
  isLocked?: boolean;
  lockReason?: string;
  showMicroMilestones?: boolean;
}

export function LeveledMilestoneCard({ 
  milestone, 
  userProgress, 
  onComplete, 
  onMicroComplete,
  isLocked = false,
  lockReason,
  showMicroMilestones = true
}: LeveledMilestoneCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Check completion status
  const isCompleted = milestone.completed || (userProgress?.completedMilestones.includes(milestone.id) ?? false);
  
  // Check if milestone can be completed
  const canComplete = !isLocked && !isCompleted && (
    !milestone.prerequisites?.length || 
    milestone.prerequisites.every(prereq => 
      userProgress?.completedMilestones.includes(prereq) ?? false
    )
  );

  // Calculate micro-milestone progress
  const microMilestones = milestone.microMilestones || [];
  const completedMicros = microMilestones.filter(micro => 
    micro.completed || userProgress?.completedMicroMilestones.includes(micro.id)
  ).length;
  const microProgress = microMilestones.length > 0 ? (completedMicros / microMilestones.length) * 100 : 0;

  const handleComplete = () => {
    if (onComplete && (canComplete || isCompleted)) {
      onComplete(milestone.id);
    }
  };

  const handleMicroComplete = (microId: string) => {
    if (onMicroComplete) {
      onMicroComplete(microId);
    }
  };

  return (
    <Card className={`border-gray-200 transition-all duration-200 ${
      isLocked ? 'opacity-50' : ''
    } ${isCompleted ? 'bg-gray-50' : 'bg-white hover:shadow-sm hover:-translate-y-0.5'}`}>
      <CardContent className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex-1">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
              {milestone.title}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
              {milestone.description}
            </p>
          </div>
          
          {/* Status Icon */}
          <div className="ml-3 sm:ml-4 flex-shrink-0">
            {isLocked ? (
              <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            ) : isCompleted ? (
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-900" />
            ) : (
              <Circle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            )}
          </div>
        </div>

        {/* Lock Reason */}
        {isLocked && lockReason && (
          <div className="mb-3 sm:mb-4 text-xs text-gray-500">
            {lockReason}
          </div>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm text-gray-500">
          <span>Level {milestone.level}</span>
          <span className="hidden sm:inline">•</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {milestone.timeframe}
          </span>
          {milestone.category && (
            <>
              <span className="hidden sm:inline">•</span>
              <span className="capitalize">{milestone.category}</span>
            </>
          )}
        </div>

        {/* Progress Bar (if has micro-milestones) */}
        {microMilestones.length > 0 && (
          <div className="mb-3 sm:mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-600">
                {completedMicros} of {microMilestones.length} tasks
              </span>
              <span className="text-xs font-medium text-gray-900">
                {Math.round(microProgress)}%
              </span>
            </div>
            <Progress value={microProgress} className="h-1" />
          </div>
        )}

        {/* Skills */}
        {milestone.skills.length > 0 && !isExpanded && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            {milestone.skills.slice(0, 3).map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {milestone.skills.length > 3 && (
              <span className="text-xs text-gray-500">
                +{milestone.skills.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
            {/* All Skills */}
            {milestone.skills.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {milestone.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Success Criteria */}
            {milestone.successCriteria.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">Success Criteria</h4>
                <ul className="space-y-1">
                  {milestone.successCriteria.map((criteria, index) => (
                    <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">•</span>
                      {criteria}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Resources */}
            {milestone.resources.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">Resources</h4>
                <div className="space-y-2">
                  {milestone.resources.slice(0, 3).map((resource, index) => (
                    <a
                      key={index}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-accent hover:text-accent-dark transition-colors"
                    >
                      {resource.title} →
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Micro-milestones */}
            {showMicroMilestones && microMilestones.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">Tasks</h4>
                <div className="space-y-2">
                  {microMilestones.map((micro) => (
                    <MicroMilestoneItem
                      key={micro.id}
                      microMilestone={micro}
                      isCompleted={micro.completed || userProgress?.completedMicroMilestones.includes(micro.id) || false}
                      onComplete={() => handleMicroComplete(micro.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-3 sm:mt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
          >
            {isExpanded ? (
              <>
                Less
                <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
              </>
            ) : (
              <>
                More
                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
              </>
            )}
          </button>

          <Button
            onClick={handleComplete}
            disabled={isLocked || (!canComplete && !isCompleted)}
            variant={isCompleted ? "secondary" : "default"}
            size="sm"
          >
            {isLocked ? (
              'Locked'
            ) : isCompleted ? (
              'Mark as Incomplete'
            ) : canComplete ? (
              'Mark as Complete'
            ) : (
              'Prerequisites Required'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Micro-milestone item component
function MicroMilestoneItem({ 
  microMilestone, 
  isCompleted, 
  onComplete 
}: { 
  microMilestone: MicroMilestone; 
  isCompleted: boolean; 
  onComplete: () => void; 
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onComplete}
        className={`flex-shrink-0 w-4 h-4 rounded-full border-2 transition-all ${
          isCompleted 
            ? 'bg-gray-900 border-gray-900' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
      />
      <span className={`text-xs ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
        {microMilestone.title}
      </span>
    </div>
  );
}