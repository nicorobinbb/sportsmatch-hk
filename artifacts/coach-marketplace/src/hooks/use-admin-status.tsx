import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";

interface AdminStatus {
  isAdmin: boolean;
  userId: string;
}

export function useAdminStatus() {
  const { isSignedIn } = useAuth();

  return useQuery<AdminStatus>({
    queryKey: ["admin-status"],
    enabled: !!isSignedIn,
    queryFn: async () => {
      const res = await fetch("/api/admin/status", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch admin status");
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}
