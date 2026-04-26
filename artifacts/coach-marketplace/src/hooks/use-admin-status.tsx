import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { getAuthToken } from "@/lib/auth-token";
import { getBaseUrl } from "@/lib/api";

interface AdminStatus {
  isAdmin: boolean;
  userId: string;
}

export function useAdminStatus() {
  return useQuery<AdminStatus>({
    queryKey: ["admin-status"],
    queryFn: async () => {
      const token = await getAuthToken();
      console.log("[AdminStatus] Token:", token ? "present" : "missing");
      if (!token) {
        throw new Error("No auth token available");
      }
      const res = await fetch(`${getBaseUrl()}/api/admin/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("[AdminStatus] Response:", res.status);
      if (!res.ok) {
        const text = await res.text();
        console.error("[AdminStatus] Error response:", text);
        throw new Error(`Failed to fetch admin status: ${res.status}`);
      }
      const data = await res.json();
      console.log("[AdminStatus] Data:", data);
      return data;
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
    retryDelay: 1000,
  });
}