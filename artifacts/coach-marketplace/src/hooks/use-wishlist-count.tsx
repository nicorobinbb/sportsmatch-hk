import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import { getBaseUrl } from "@/lib/api";

export function useWishlistCount() {
  const { isSignedIn, getToken } = useAuth();

  return useQuery<number>({
    queryKey: ["wishlist-count"],
    enabled: !!isSignedIn,
    queryFn: async () => {
      const token = await getToken();
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
