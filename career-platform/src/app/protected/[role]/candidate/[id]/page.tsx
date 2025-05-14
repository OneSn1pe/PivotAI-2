"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useRoadmapAccess } from "@/hooks/useRoadmapAccess";
import { UserRole } from "@/types/user";
import RoadmapViewer from "@/components/roadmap/RoadmapViewer";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";

export default function CandidateDetailPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const candidateId = params.id as string;
  
  const [candidateName, setCandidateName] = useState<string>("");
  
  // Use our custom hook for roadmap access
  const { 
    roadmap, 
    loading: roadmapLoading, 
    error, 
    accessType 
  } = useRoadmapAccess(candidateId);
  
  // Fetch candidate name
  useEffect(() => {
    if (candidateId && userProfile) {
      // If viewing own profile
      if (userProfile.uid === candidateId) {
        setCandidateName(userProfile.displayName);
      } else {
        // Fetch candidate name from API
        fetch(`/api/candidates/${candidateId}/basic-info`)
          .then(res => res.json())
          .then(data => {
            if (data.displayName) {
              setCandidateName(data.displayName);
            }
          })
          .catch(err => console.error("Error fetching candidate info:", err));
      }
    }
  }, [candidateId, userProfile]);
  
  // Handle loading states
  if (authLoading || roadmapLoading) {
    return <LoadingSpinner message="Loading roadmap..." />;
  }
  
  // Handle access denied
  if (accessType === "none" || error) {
    return (
      <ErrorMessage 
        title="Access Denied" 
        message={error || "You don't have permission to view this roadmap."} 
        actionText="Go back to dashboard"
        onAction={() => router.push(
          userProfile?.role === UserRole.RECRUITER
            ? "/protected/recruiter/dashboard" 
            : "/protected/candidate/dashboard"
        )}
      />
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {roadmap && (
        <RoadmapViewer 
          roadmap={roadmap} 
          accessType={accessType}
          candidateName={candidateName}
        />
      )}
    </div>
  );
} 