'use client';

import React, { useMemo } from 'react';
import { Milestone, UserProgress } from '@/types/user';
import { LeveledMilestoneCard } from './LeveledMilestoneCard';
import { isMilestoneUnlocked } from '@/services/milestoneUnlockService';
import { EmptyState } from '@/components/ui/empty-state';
import { Target } from 'lucide-react';
import { useInView } from '@/hooks/useMinimalistAnimations';

interface LazyMilestoneListProps {
  milestones: Milestone[];
  userProgress: UserProgress;
  onMilestoneComplete: (milestoneId: string) => void;
  onMicroComplete: (microId: string) => void;
}

export function LazyMilestoneList({
  milestones,
  userProgress,
  onMilestoneComplete,
  onMicroComplete
}: LazyMilestoneListProps) {
  // Group milestones by level
  const milestonesByLevel = useMemo(() => {
    return milestones.reduce((acc, milestone) => {
      const level = milestone.level || 1;
      if (!acc[level]) acc[level] = [];
      acc[level].push(milestone);
      return acc;
    }, {} as Record<number, Milestone[]>);
  }, [milestones]);

  if (milestones.length === 0) {
    return (
      <EmptyState
        illustration="NoProgress"
        title="No milestones yet"
        description="Milestones will appear here once they're added to your roadmap"
      />
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(milestonesByLevel).map(([level, levelMilestones]) => (
        <LazyLevelSection
          key={level}
          level={Number(level)}
          milestones={levelMilestones}
          userProgress={userProgress}
          onMilestoneComplete={onMilestoneComplete}
          onMicroComplete={onMicroComplete}
        />
      ))}
    </div>
  );
}

// Lazy-loaded level section
function LazyLevelSection({
  level,
  milestones,
  userProgress,
  onMilestoneComplete,
  onMicroComplete
}: {
  level: number;
  milestones: Milestone[];
  userProgress: UserProgress;
  onMilestoneComplete: (milestoneId: string) => void;
  onMicroComplete: (microId: string) => void;
}) {
  const { ref, isInView } = useInView({ threshold: 0.1, rootMargin: '100px' });

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Level {level}</h3>
      {isInView ? (
        <div className="grid gap-4">
          {milestones.map((milestone) => {
            const isUnlocked = isMilestoneUnlocked(milestone, userProgress);
            return (
              <LeveledMilestoneCard
                key={milestone.id}
                milestone={milestone}
                userProgress={userProgress}
                onComplete={onMilestoneComplete}
                onMicroComplete={onMicroComplete}
                isLocked={!isUnlocked}
                lockReason={!isUnlocked ? `Complete Level ${(milestone.level || 1) - 1} to unlock` : undefined}
              />
            );
          })}
        </div>
      ) : (
        <div className="grid gap-4">
          {milestones.map((milestone) => (
            <div key={milestone.id} className="h-48 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      )}
    </div>
  );
}