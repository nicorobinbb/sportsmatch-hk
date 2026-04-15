import { Link } from "wouter";
import { Show, useClerk } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Activity, Dumbbell, ShieldCheck, LayoutDashboard } from "lucide-react";
import { useAdminStatus } from "@/hooks/use-admin-status";

export function Navbar() {
  const { signOut } = useClerk();
  const { data: adminStatus } = useAdminStatus();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-primary">
            運對
          </span>
        </Link>
        <nav className="flex items-center gap-4">
          <Show when="signed-out">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">登入</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm">註冊</Button>
            </Link>
          </Show>
          <Show when="signed-in">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="hidden sm:flex">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                我的主頁
              </Button>
            </Link>
            <Link href="/coach/register">
              <Button variant="outline" size="sm" className="hidden sm:flex border-primary text-primary hover:bg-primary/10">
                <Dumbbell className="mr-2 h-4 w-4" />
                我是教練
              </Button>
            </Link>
            {adminStatus?.isAdmin && (
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="hidden sm:flex">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  管理後台
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              登出
            </Button>
          </Show>
        </nav>
      </div>
    </header>
  );
}
