import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { getBaseUrl } from "@/lib/api";

export function useWishlistCount() {
  const { isSignedIn, session } = useAuth();

  return useQuery<number>({
    queryKey: ["wishlist-count"],
    enabled: !!isSignedIn && !!session?.access_token,
    queryFn: async () => {
      const token = session?.access_token;
      const res = await fetch(`${getBaseUrl()}/api/wishlist`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return 0;
      const data = await res.json();
      return (data.coaches ?? []).length;
    },
    staleTime: 1000 * 30,
  });
}