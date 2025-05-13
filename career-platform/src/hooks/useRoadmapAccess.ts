import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, CandidateProfile, CareerRoadmap } from '@/types/user';

interface RoadmapAccessResult {
  roadmap: CareerRoadmap | null;
  candidate: CandidateProfile | null;
  loading: boolean;
  error: string | null;
  hasAccess: boolean;
}

/**
 * Custom hook for accessing candidate roadmaps with proper authorization
 * @param candidateId The ID of the candidate whose roadmap to access
 * @returns Object containing roadmap data, loading state, error state, and access status
 */
export function useRoadmapAccess(candidateId: string): RoadmapAccessResult {
  const { userProfile, loading: authLoading } = useAuth();
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const [candidate, setCandidate] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean>(false);

  useEffect(() => {
    // Skip if still loading auth or no user profile
    if (authLoading || !userProfile) {
      return;
    }

    // Reset states when candidateId changes
    setLoading(true);
    setError(null);
    setRoadmap(null);
    setCandidate(null);
    setHasAccess(false);

    // Check if user has access (either recruiter or the candidate themselves)
    const userHasAccess = 
      userProfile.role === UserRole.RECRUITER || 
      userProfile.uid === candidateId;

    if (!userHasAccess) {
      setError('You do not have permission to view this roadmap');
      setLoading(false);
      return;
    }

    // Set initial access state based on role
    setHasAccess(userHasAccess);

    // Fetch roadmap data from the API
    const fetchRoadmap = async () => {
      try {
        const response = await fetch(`/api/candidates/${candidateId}/roadmap`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Error ${response.status}: Failed to fetch roadmap`);
        }
        
        const data = await response.json();
        
        // Update state with the fetched data
        setRoadmap(data.roadmap);
        setCandidate(data.candidate);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching roadmap:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch roadmap');
        setLoading(false);
      }
    };

    // Only fetch if user has access
    if (userHasAccess) {
      fetchRoadmap();
    }
  }, [candidateId, userProfile, authLoading]);

  return {
    roadmap,
    candidate,
    loading: loading || authLoading,
    error,
    hasAccess
  };
} 