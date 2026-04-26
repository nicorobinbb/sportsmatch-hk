import { useContext } from "react";
import { AuthContext } from "@/lib/auth-context";
import type { Session } from "@supabase/supabase-js";

// Global session store for token retrieval
let _currentSession: Session | null = null;

export function setGlobalSession(session: Session | null) {
  _currentSession = session;
}

export function getGlobalSession(): Session | null {
  return _currentSession;
}

export function useAuth() {
  return useContext(AuthContext);
}