import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Home, LayoutDashboard, Menu, X, LogOut, Trophy } from "lucide-react";
import { useAdminStatus } from "@/hooks/use-admin-status";
import { useCoachStatus } from "@/hooks/use-coach-status";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";

export function Navbar() {
  const { isSignedIn } = useAuth();
  const { data: adminStatus } = useAdminStatus();
  const { data: coachStatus } = useCoachStatus();
  const isAdmin = adminStatus?.isAdmin ?? false;
  const isCoach = coachStatus?.isCoach ?? false;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [, navigate] = useLocation();

  async function handleSignOut() {
    setMobileOpen(false);
    await supabase.auth.signOut();
    navigate("/");
  }

  function handleNavigate(path: string) {
    setMobileOpen(false);
    navigate(path);
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-screen-2xl flex h-16 items-center justify-between px-4 md:px-10">
        {/* Logo */}
        <Link href="/" className="flex items-center" onClick={() => setMobileOpen(false)}>
          <img src={`${import.meta.env.BASE_URL}logo-transparent.png`} alt="SportsMatch 運對" className="h-14 w-auto" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-2">
          {!isSignedIn && (<>
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">登入</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm">註冊</Button>
            </Link>
          </>)}
          {isSignedIn && (<>
            <Link href="/">
              <Button variant="ghost" size="sm">
                <Home className="mr-2 h-4 w-4" />
                主頁
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                我的主頁
              </Button>
            </Link>
            <Link href={isCoach ? "/coach-portal" : "/coach/register"}>
              <Button variant="ghost" size="sm" className="text-primary">
                <Trophy className="mr-2 h-4 w-4" />
                {isCoach ? "我是教練" : "成為教練"}
              </Button>
            </Link>
            {isAdmin && (
              <Button variant="ghost" size="sm" onClick={() => handleNavigate("/admin")}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                管理員
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              登出
            </Button>
          </>)}
        </nav>

        {/* Mobile menu button */}
        <button
          className="sm:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="sm:hidden border-t bg-background">
          <nav className="flex flex-col p-4 gap-2">
            {!isSignedIn && (<>
              <Link href="/sign-in" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">登入</Button>
              </Link>
              <Link href="/sign-up" onClick={() => setMobileOpen(false)}>
                <Button className="w-full justify-start">註冊</Button>
              </Link>
            </>)}
            {isSignedIn && (<>
              <Button variant="ghost" className="w-full justify-start" onClick={() => handleNavigate("/")}>
                <Home className="mr-2 h-4 w-4" />
                主頁
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => handleNavigate("/dashboard")}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                我的主頁
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-primary"
                onClick={() => handleNavigate(isCoach ? "/coach-portal" : "/coach/register")}
              >
                <Trophy className="mr-2 h-4 w-4" />
                {isCoach ? "我是教練" : "成為教練"}
              </Button>
              {isAdmin && (
                <Button variant="ghost" className="w-full justify-start" onClick={() => handleNavigate("/admin")}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  管理員
                </Button>
              )}
              <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                登出
              </Button>
            </>)}
          </nav>
        </div>
      )}
    </header>
  );
}