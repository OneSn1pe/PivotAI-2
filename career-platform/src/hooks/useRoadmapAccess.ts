import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole, CareerRoadmap } from "@/types/user";

export function useRoadmapAccess(candidateId: string) {
  const { userProfile } = useAuth();
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessType, setAccessType] = useState<"owner" | "recruiter" | "none">("none");

  useEffect(() => {
    if (!userProfile || !candidateId) {
      setLoading(false);
      return;
    }

    const fetchRoadmap = async () => {
      try {
        // Determine access type
        if (userProfile.uid === candidateId) {
          setAccessType("owner");
        } else if (userProfile.role === UserRole.RECRUITER) {
          setAccessType("recruiter");
        } else {
          setAccessType("none");
          setError("You don't have access to this roadmap");
          setLoading(false);
          return;
        }

        // Fetch roadmap through API
        const response = await fetch(`/api/roadmaps/${candidateId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch roadmap: ${response.statusText}`);
        }
        
        const data = await response.json();
        setRoadmap(data.roadmap);
      } catch (err) {
        console.error("Error in useRoadmapAccess:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmap();
  }, [userProfile, candidateId]);

  return { roadmap, loading, error, accessType };
} 