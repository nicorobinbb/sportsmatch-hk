import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider, SignIn, SignUp, useClerk, useAuth } from '@clerk/react';
import { Layout } from '@/components/layout';
import { useEffect, useRef, useState } from "react";
import { queryClient } from "@/lib/queryClient";
import { setAuthTokenGetter } from "@workspace/api-client-react";

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import CoachProfile from "@/pages/coach-profile";
import CoachRegister from "@/pages/coach-register";
import AdminDashboard from "@/pages/admin-dashboard";
import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import Terms from "@/pages/terms";
import Disclaimer from "@/pages/disclaimer";
import Privacy from "@/pages/privacy";
import About from "@/pages/about";
import Faq from "@/pages/faq";
import { setTokenGetter } from "@/lib/auth-token";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

function SignInPage() {
  return (
    <Layout>
      <div className="flex justify-center items-center flex-1 py-12 px-4">
        <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
      </div>
    </Layout>
  );
}

function SignUpPage() {
  return (
    <Layout>
      <div className="flex justify-center items-center flex-1 py-12 px-4">
        <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
      </div>
    </Layout>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function ClerkAuthTokenSetup() {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn) {
      setAuthTokenGetter(() => getToken());
      setTokenGetter(() => getToken());
    } else {
      setAuthTokenGetter(null);
      setTokenGetter(null);
    }
    return () => {
      setAuthTokenGetter(null);
      setTokenGetter(null);
    };
  }, [getToken, isSignedIn]);

  return null;
}

const SKIP_ONBOARDING_PATHS = ["/onboarding", "/sign-in", "/sign-up", "/coach/register", "/admin"];

function OnboardingRedirect() {
  const { isSignedIn, isLoaded } = useAuth();
  const { getToken } = useAuth();
  const [location, navigate] = useLocation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) { setChecked(true); return; }
    const clean = location.split("?")[0];
    if (SKIP_ONBOARDING_PATHS.some(p => clean === p || clean.startsWith(p + "/"))) { setChecked(true); return; }

    (async () => {
      try {
        const token = await getToken();
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
  }, [isLoaded, isSignedIn, location]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <ClerkAuthTokenSetup />
        <TooltipProvider>
          <OnboardingRedirect />
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/coaches/:id" component={CoachProfile} />
            <Route path="/coach/register" component={CoachRegister} />
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
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
