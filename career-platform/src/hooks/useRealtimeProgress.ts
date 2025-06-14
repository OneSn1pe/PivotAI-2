import { useEffect, useState } from 'react';
import { db } from '@/config/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { UserProgress } from '@/types/user';

export function useRealtimeProgress(userId: string) {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Set up real-time listener for user progress
    const unsubscribe = onSnapshot(
      doc(db, 'userProgress', userId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setProgress({
            ...data,
            lastActiveDate: data.lastActiveDate?.toDate() || new Date(),
          } as UserProgress);
        } else {
          // Initialize progress if it doesn't exist
          setProgress({
            userId,
            currentLevel: 1,
            currentXP: 0,
            totalXP: 0,
            maxUnlockedLevel: 1,
            completedMilestones: [],
            completedMicroMilestones: [],
            achievements: [],
            streakDays: 0,
            lastActiveDate: new Date(),
            skillProficiencies: {},
          });
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to user progress:', error);
        setError(error as Error);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [userId]);

  return { progress, loading, error };
}