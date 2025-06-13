'use client';

import dynamic from 'next/dynamic';
import { UserProgress, Achievement } from '@/types/user';
import { SkeletonProgress } from '@/components/ui/skeleton';

// Lazy load the ProgressDashboard component
const ProgressDashboard = dynamic(
  () => import('./ProgressDashboard').then(mod => ({ default: mod.ProgressDashboard })),
  { 
    loading: () => <SkeletonProgress />,
    ssr: false 
  }
);

interface ProgressDashboardLazyProps {
  userProgress: UserProgress;
  achievements: Achievement[];
  className?: string;
}

export function ProgressDashboardLazy(props: ProgressDashboardLazyProps) {
  return <ProgressDashboard {...props} />;
}