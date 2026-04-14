import { Navbar } from "./navbar";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-background">
      <Navbar />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <footer className="py-8 border-t bg-white dark:bg-card">
        <div className="container px-4 md:px-6 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} CoachMatch HK. Real coaches, transparent pricing.</p>
        </div>
      </footer>
    </div>
  );
}
