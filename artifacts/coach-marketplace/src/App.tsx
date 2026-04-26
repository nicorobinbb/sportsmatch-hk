import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SupabaseClient, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { Layout } from '@/components/layout';
import { useEffect, useRef, useState } from "react";
import { queryClient } from "@/lib/queryClient";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
import { getBaseUrl } from "@/lib/api";
import { AuthContext } from "@/lib/auth-context";

// Set API base URL for all environments
if (typeof window !== "undefined") {
  setBaseUrl(getBaseUrl());
}

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import CoachProfile from "@/pages/coach-profile";
import CoachRegister from "@/pages/coach-register";
import CoachPortal from "@/pages/coach-portal";
import CoachEdit from "@/pages/coach-edit";
import AdminDashboard from "@/pages/admin-dashboard";
import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import Terms from "@/pages/terms";
import Disclaimer from "@/pages/disclaimer";
import Privacy from "@/pages/privacy";
import About from "@/pages/about";
import Faq from "@/pages/faq";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";

// useAuth is now in @/hooks/use-auth

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

function SupabaseQueryClientCacheInvalidator({ userId }: { userId: string | null }) {
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (
      prevUserIdRef.current !== undefined &&
      prevUserIdRef.current !== userId
    ) {
      queryClient.clear();
    }
    prevUserIdRef.current = userId;
  }, [userId, queryClient]);

  return null;
}

function SupabaseAuthTokenSetup({ session }: { session: Session | null }) {
  useEffect(() => {
    setAuthTokenGetter(() => session?.access_token ?? null);
    return () => setAuthTokenGetter(null);
  }, [session?.access_token]);
  return null;
}

const SKIP_ONBOARDING_PATHS = ["/onboarding", "/sign-in", "/sign-up", "/coach/register", "/coach-portal", "/admin"];

function OnboardingRedirect({ session }: { session: Session | null }) {
  const [location, navigate] = useLocation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!session) { setChecked(true); return; }
    const clean = location.split("?")[0];
    if (SKIP_ONBOARDING_PATHS.some(p => clean === p || clean.startsWith(p + "/"))) { setChecked(true); return; }

    (async () => {
      try {
        const token = session.access_token;
        const res = await fetch(`${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!data.profile || !data.profile.onboardingCompleted) {
          navigate("/onboarding");
        }
      } catch {}
      setChecked(true);
    })();
  }, [session, location]);

  return null;
}

function SupabaseProviderWithRoutes() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      console.log("[Auth] initAuth started");
      try {
        console.log("[Auth] Calling getSession...");
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log("[Auth] getSession returned");
        if (error) {
          console.error("[Auth] Error:", error);
        } else {
          console.log("[Auth] Session:", session ? "found" : "null");
        }
        if (mounted) {
          setSession(session);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("[Auth] Exception:", err);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    // Start auth init
    initAuth();
    
    // Safety timeout - force stop loading after 3 seconds
    const timeout = setTimeout(() => {
      console.log("[Auth] Safety timeout triggered");
      if (mounted) {
        setIsLoading(false);
      }
    }, 3000);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[Auth] Event:", event, "User:", session?.user?.email);
      if (mounted) {
        setSession(session);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setLocation("/");
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user: session?.user ?? null, 
      isLoading,
      isSignedIn: !!session?.user,
      signOut 
    }}>
      <QueryClientProvider client={queryClient}>
        <SupabaseQueryClientCacheInvalidator userId={session?.user?.id ?? null} />
        <SupabaseAuthTokenSetup session={session} />
        <TooltipProvider>
          <OnboardingRedirect session={session} />
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/coaches/:id" component={CoachProfile} />
            <Route path="/coach/register" component={CoachRegister} />
            <Route path="/coach-portal" component={CoachPortal} />
            <Route path="/coach/edit/:id" component={CoachEdit} />
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/onboarding" component={Onboarding} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/terms" component={Terms} />
            <Route path="/disclaimer" component={Disclaimer} />
            <Route path="/privacy" component={Privacy} />
            <Route path="/about" component={About} />
            <Route path="/faq" component={Faq} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </AuthContext.Provider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <SupabaseProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;