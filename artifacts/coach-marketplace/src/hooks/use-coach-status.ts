import { useQuery } from "@tanstack/react-query";
import { getBaseUrl } from "@/lib/api";
import { useAuth } from "./use-auth";
import { getAuthToken } from "@/lib/auth-token";

interface MyCoach {
  id: number;
  name: string;
  sportsCategory: string;
  location: string;
  isApproved: boolean;
  pendingEdits: string | null;
  profileImageUrl?: string | null;
  createdAt: string;
}

interface CoachStatusResponse {
  coaches: MyCoach[];
  isCoach: boolean;
  hasPendingApproval: boolean;
}

async function fetchCoachStatus(): Promise<CoachStatusResponse> {
  const token = await getAuthToken();
  if (!token) throw new Error("Not authenticated");
  
  const res = await fetch(`${getBaseUrl()}/api/coaches/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) throw new Error("Failed to fetch coach status");
  
  const data = await res.json();
  const coaches: MyCoach[] = data.coaches || [];
  
  return {
    coaches,
    isCoach: coaches.length > 0,
    hasPendingApproval: coaches.some((c: MyCoach) => c.pendingEdits),
  };
}

export function useCoachStatus() {
  const { isSignedIn } = useAuth();
  
  return useQuery({
    queryKey: ["coachStatus"],
    queryFn: fetchCoachStatus,
    enabled: isSignedIn,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
