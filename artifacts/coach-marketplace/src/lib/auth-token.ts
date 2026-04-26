import { supabase } from "./supabase";

export async function getAuthToken(): Promise<string | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error("[getAuthToken] Error:", error);
      return null;
    }
    if (session?.access_token) {
      console.log("[getAuthToken] Token found, length:", session.access_token.length);
    } else {
      console.log("[getAuthToken] No token");
    }
    return session?.access_token ?? null;
  } catch (err) {
    console.error("[getAuthToken] Exception:", err);
    return null;
  }
}
