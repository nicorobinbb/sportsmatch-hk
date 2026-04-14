import { Link } from "wouter";
import { Show, useClerk } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Activity, Dumbbell, ShieldCheck, User } from "lucide-react";

export function Navbar() {
  const { signOut } = useClerk();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-primary">
            CoachMatch HK
          </span>
        </Link>
        <nav className="flex items-center gap-4">
          <Show when="signed-out">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm">Sign Up</Button>
            </Link>
          </Show>
          <Show when="signed-in">
            <Link href="/coach/register">
              <Button variant="outline" size="sm" className="hidden sm:flex border-primary text-primary hover:bg-primary/10">
                <Dumbbell className="mr-2 h-4 w-4" />
                Become a Coach
              </Button>
            </Link>
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="hidden sm:flex">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Admin
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              Sign Out
            </Button>
          </Show>
        </nav>
      </div>
    </header>
  );
}
