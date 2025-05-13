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
        console.log(`[useRoadmapAccess] Checking access for candidateId: ${candidateId}, userRole: ${userProfile.role}`);
        
        // Determine access type
        if (userProfile.uid === candidateId) {
          console.log(`[useRoadmapAccess] User is the owner of this roadmap`);
          setAccessType("owner");
        } else if (userProfile.role === UserRole.RECRUITER) {
          console.log(`[useRoadmapAccess] User is a recruiter, granting access`);
          setAccessType("recruiter");
        } else {
          console.log(`[useRoadmapAccess] Access denied: User is not owner or recruiter`);
          setAccessType("none");
          setError("You don't have permission to view this roadmap");
          setLoading(false);
          return;
        }

        // Fetch roadmap through API
        console.log(`[useRoadmapAccess] Fetching roadmap data from API`);
        const response = await fetch(`/api/roadmaps/${candidateId}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            errorData = { error: errorText };
          }
          
          console.error(`[useRoadmapAccess] API error: ${response.status}`, errorData);
          
          // Enhanced error reporting
          const errorDetails = {
            status: response.status,
            statusText: response.statusText,
            error: errorData.error || 'Unknown error',
            headers: {
              contentType: response.headers.get('content-type'),
              authStatus: response.headers.get('x-auth-status'),
            }
          };
          
          console.error('[useRoadmapAccess] Error details:', errorDetails);
          throw new Error(errorData.error || `Failed to fetch roadmap: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`[useRoadmapAccess] Roadmap data fetched successfully`);
        setRoadmap(data.roadmap);
      } catch (err) {
        console.error("[useRoadmapAccess] Error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmap();
  }, [userProfile, candidateId]);

  return { roadmap, loading, error, accessType };
} 