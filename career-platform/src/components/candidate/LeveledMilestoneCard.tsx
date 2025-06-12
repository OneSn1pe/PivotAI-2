'use client';

import React, { useState } from 'react';
import { Milestone, UserProgress, MicroMilestone } from '@/types/user';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Lock, 
  CheckCircle, 
  Circle, 
  Star, 
  Trophy, 
  Target, 
  Clock, 
  Zap,
  ChevronDown,
  ChevronUp,
  Play,
  BookOpen,
  Code,
  Users,
  Award
} from 'lucide-react';

interface LeveledMilestoneCardProps {
  milestone: Milestone;
  userProgress?: UserProgress;
  onComplete?: (milestoneId: string) => void;
  onMicroComplete?: (microId: string) => void;
  isLocked?: boolean;
  showMicroMilestones?: boolean;
}

const categoryIcons = {
  'technical': Code,
  'fundamental': BookOpen,
  'niche': Target,
  'soft': Users,
  'career': Trophy
};

const categoryColors = {
  'technical': 'bg-blue-500',
  'fundamental': 'bg-green-500', 
  'niche': 'bg-purple-500',
  'soft': 'bg-orange-500',
  'career': 'bg-red-500'
};

const priorityColors = {
  'critical': 'border-red-500 bg-red-50',
  'high': 'border-orange-500 bg-orange-50',
  'medium': 'border-blue-500 bg-blue-50',
  'low': 'border-gray-500 bg-gray-50'
};

const typeIcons = {
  'learning': BookOpen,
  'building': Code,
  'practicing': Target,
  'connecting': Users,
  'achieving': Award
};

export function LeveledMilestoneCard({ 
  milestone, 
  userProgress, 
  onComplete, 
  onMicroComplete,
  isLocked = false,
  showMicroMilestones = true
}: LeveledMilestoneCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMicros, setShowMicros] = useState(false);
  
  const CategoryIcon = categoryIcons[milestone.category as keyof typeof categoryIcons] || BookOpen;
  const categoryColor = categoryColors[milestone.category as keyof typeof categoryColors] || 'bg-gray-500';
  const priorityStyle = priorityColors[milestone.priority as keyof typeof priorityColors] || 'border-gray-500 bg-gray-50';
  
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

  // Difficulty stars
  const difficultyStars = Array.from({ length: 5 }, (_, i) => i < (milestone.difficulty || 3));

  const handleComplete = () => {
    if (onComplete && canComplete) {
      onComplete(milestone.id);
    }
  };

  const handleMicroComplete = (microId: string) => {
    if (onMicroComplete) {
      onMicroComplete(microId);
    }
  };

  return (
    <Card className={`milestone-card transition-all duration-300 hover:shadow-lg ${
      isLocked ? 'opacity-60' : ''
    } ${isCompleted ? 'border-green-500 bg-green-50' : priorityStyle}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* Category Icon */}
            <div className={`p-2 rounded-lg ${categoryColor} text-white`}>
              <CategoryIcon className="h-5 w-5" />
            </div>
            
            <div className="flex-1">
              {/* Level Badge */}
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs font-semibold">
                  Level {milestone.level}
                </Badge>
                {milestone.isCapstone && (
                  <Badge variant="outline" className="text-xs">
                    <Trophy className="h-3 w-3 mr-1" />
                    Capstone
                  </Badge>
                )}
              </div>
              
              {/* Title */}
              <CardTitle className="text-lg leading-tight">{milestone.title}</CardTitle>
            </div>
          </div>
          
          {/* Status Icon */}
          <div className="flex items-center gap-2">
            {isLocked && <Lock className="h-5 w-5 text-gray-400" />}
            {isCompleted && <CheckCircle className="h-5 w-5 text-green-500" />}
            {!isLocked && !isCompleted && (
              <Circle className={`h-5 w-5 ${canComplete ? 'text-blue-500' : 'text-gray-400'}`} />
            )}
          </div>
        </div>

        {/* XP and Difficulty Row */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-4">
            {/* XP Value */}
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-semibold text-yellow-600">
Level {milestone.level}
              </span>
            </div>
            
            {/* Time Estimate */}
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">{milestone.timeframe}</span>
            </div>
          </div>
          
          {/* Difficulty Stars */}
          <div className="flex items-center gap-1">
            {difficultyStars.map((filled, index) => (
              <Star 
                key={index} 
                className={`h-4 w-4 ${filled ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
              />
            ))}
          </div>
        </div>

        {/* Micro-milestone Progress */}
        {microMilestones.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">
                Progress: {completedMicros}/{microMilestones.length} tasks
              </span>
              <span className="text-sm font-semibold text-gray-700">
                {Math.round(microProgress)}%
              </span>
            </div>
            <Progress value={microProgress} className="h-2" />
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {/* Description */}
          <p className="text-gray-700 mb-4">{milestone.description}</p>
          
          {/* Skills */}
          {milestone.skills.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Skills You'll Learn</h4>
              <div className="flex flex-wrap gap-2">
                {milestone.skills.map((skill, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Success Criteria */}
          {milestone.successCriteria.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Success Criteria</h4>
              <ul className="space-y-1">
                {milestone.successCriteria.map((criteria, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {criteria}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Resources */}
          {milestone.resources.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Learning Resources</h4>
              <div className="space-y-2">
                {milestone.resources.slice(0, 3).map((resource, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <Badge variant="outline" className="text-xs">
                      {resource.type}
                    </Badge>
                    <div className="flex-1">
                      <a 
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                      >
                        {resource.title}
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-3 w-3" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      {resource.description && (
                        <p className="text-xs text-gray-600 mt-1">{resource.description}</p>
                      )}
                      {resource.estimatedTime && (
                        <p className="text-xs text-gray-500 mt-1">Duration: {resource.estimatedTime}</p>
                      )}
                    </div>
                    {resource.cost && (
                      <Badge variant={resource.cost === 'free' ? 'secondary' : 'outline'} className="text-xs">
                        {resource.cost}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Micro-milestones */}
          {showMicroMilestones && microMilestones.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700">Task Breakdown</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMicros(!showMicros)}
                  className="text-xs"
                >
                  {showMicros ? (
                    <>Hide Tasks <ChevronUp className="h-4 w-4 ml-1" /></>
                  ) : (
                    <>Show Tasks <ChevronDown className="h-4 w-4 ml-1" /></>
                  )}
                </Button>
              </div>
              
              {showMicros && (
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
              )}
            </div>
          )}
        </CardContent>
      )}

      <CardFooter className="pt-3 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm"
        >
          {isExpanded ? (
            <>Less Details <ChevronUp className="h-4 w-4 ml-1" /></>
          ) : (
            <>More Details <ChevronDown className="h-4 w-4 ml-1" /></>
          )}
        </Button>

        <Button
          onClick={handleComplete}
          disabled={!canComplete}
          variant={isCompleted ? "outline" : "default"}
          size="sm"
          className={isCompleted ? "text-green-600" : ""}
        >
          {isLocked ? (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Locked
            </>
          ) : isCompleted ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Completed
            </>
          ) : canComplete ? (
            <>
              <Play className="h-4 w-4 mr-2" />
              Start Milestone
            </>
          ) : (
            <>
              <Circle className="h-4 w-4 mr-2" />
              Prerequisites Required
            </>
          )}
        </Button>
      </CardFooter>
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
  const TypeIcon = typeIcons[microMilestone.type] || BookOpen;
  
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
      isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-gray-300'
    }`}>
      <button
        onClick={onComplete}
        className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
          isCompleted 
            ? 'bg-green-500 border-green-500 text-white' 
            : 'border-gray-300 hover:border-blue-500'
        }`}
      >
        {isCompleted && <CheckCircle className="h-3 w-3" />}
      </button>
      
      <div className="flex items-center gap-2 flex-1">
        <TypeIcon className={`h-4 w-4 ${isCompleted ? 'text-green-600' : 'text-gray-500'}`} />
        <div className="flex-1">
          <p className={`text-sm font-medium ${isCompleted ? 'text-green-800 line-through' : 'text-gray-900'}`}>
            {microMilestone.title}
          </p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-gray-500">{microMilestone.estimatedTime}</span>
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-yellow-500" />
            </div>
          </div>
        </div>
      </div>
      
      <Badge variant="outline" className="text-xs capitalize">
        {microMilestone.type}
      </Badge>
    </div>
  );
}