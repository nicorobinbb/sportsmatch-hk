import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Show, useClerk } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Dumbbell, ShieldCheck, LayoutDashboard, Heart, Menu, X, LogOut } from "lucide-react";
import { useAdminStatus } from "@/hooks/use-admin-status";
import { useWishlistCount } from "@/hooks/use-wishlist-count";

export function Navbar() {
  const { signOut } = useClerk();
  const { data: adminStatus } = useAdminStatus();
  const { data: wishlistCount } = useWishlistCount();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [, navigate] = useLocation();

  function handleSignOut() {
    setMobileOpen(false);
    signOut();
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
          <img src={`${import.meta.env.BASE_URL}logo-transparent.png`} alt="SportsMatch 運對" className="h-9 w-auto" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-2">
          <Show when="signed-out">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">登入</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm">註冊</Button>
            </Link>
          </Show>
          <Show when="signed-in">
            {/* Wishlist badge */}
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="relative">
                <Heart className="h-4 w-4" />
                {!!wishlistCount && wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                )}
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                我的主頁
              </Button>
            </Link>
            <Link href="/coach/register">
              <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/10">
                <Dumbbell className="mr-2 h-4 w-4" />
                我是教練
              </Button>
            </Link>
            {adminStatus?.isAdmin && (
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  管理後台
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              登出
            </Button>
          </Show>
        </nav>

        {/* Mobile right side */}
        <div className="flex sm:hidden items-center gap-2">
          <Show when="signed-in">
            <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
              <button className="relative p-2 rounded-md hover:bg-muted transition-colors">
                <Heart className="h-5 w-5 text-foreground" />
                {!!wishlistCount && wishlistCount > 0 && (
                  <span className="absolute top-0 right-0 h-4 min-w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                )}
              </button>
            </Link>
          </Show>
          <Show when="signed-out">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">登入</Button>
            </Link>
          </Show>
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="p-2 rounded-md hover:bg-muted transition-colors"
            aria-label="選單"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t bg-background shadow-lg animate-in slide-in-from-top-2 fade-in">
          <div className="container px-4 py-3 flex flex-col gap-1">
            <Show when="signed-out">
              <button
                onClick={() => handleNavigate("/sign-in")}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-left text-sm font-medium transition-colors"
              >
                登入
              </button>
              <button
                onClick={() => handleNavigate("/sign-up")}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary text-primary-foreground text-left text-sm font-medium"
              >
                註冊
              </button>
            </Show>
            <Show when="signed-in">
              <button
                onClick={() => handleNavigate("/dashboard")}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-left text-sm font-medium transition-colors"
              >
                <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                我的主頁
                {!!wishlistCount && wishlistCount > 0 && (
                  <span className="ml-auto text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 font-semibold">
                    {wishlistCount} 個收藏
                  </span>
                )}
              </button>
              <button
                onClick={() => handleNavigate("/coach/register")}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-left text-sm font-medium transition-colors"
              >
                <Dumbbell className="h-4 w-4 text-muted-foreground" />
                成為教練
              </button>
              {adminStatus?.isAdmin && (
                <button
                  onClick={() => handleNavigate("/admin")}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-left text-sm font-medium transition-colors"
                >
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  管理後台
                </button>
              )}
              <div className="h-px bg-border my-1" />
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-left text-sm font-medium text-muted-foreground transition-colors"
              >
                <LogOut className="h-4 w-4" />
                登出
              </button>
            </Show>
          </div>
        </div>
      )}
    </header>
  );
}
