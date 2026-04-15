import { useEffect, useState } from "react";
import { useUser } from "@clerk/react";
import { getBaseUrl } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-token";

export interface UserProfileData {
  firstName?: string | null;
  lastName?: string | null;
  preferredSports: string[];
  preferredDistricts: string[];
  preferredAgeGroups: string[];
  goals: string[];
  onboardingCompleted: boolean;
}

export function useUserProfile() {
  const { isSignedIn } = useUser();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSignedIn) return;
    setLoading(true);
    getAuthToken().then(token =>
      fetch(`${getBaseUrl()}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    ).then(r => r.json()).then(data => {
      if (data?.profile) setProfile(data.profile);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [isSignedIn]);

  return { profile, loading };
}
