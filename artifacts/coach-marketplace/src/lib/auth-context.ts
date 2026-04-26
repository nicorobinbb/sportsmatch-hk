import { createContext } from "react";
import type { Session } from "@supabase/supabase-js";

export type AuthContextType = {
  session: Session | null;
  user: Session["user"] | null;
  isLoading: boolean;
  isSignedIn: boolean;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  isSignedIn: false,
  signOut: async () => {},
});
