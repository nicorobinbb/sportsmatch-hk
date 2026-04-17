import { Navbar } from "./navbar";
import { SupportWidget } from "./support-widget";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-background">
      <Navbar />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <footer className="border-t bg-white dark:bg-card">
        <div className="container px-4 md:px-10 py-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
            <div className="md:col-span-5">
              <img
                src={`${import.meta.env.BASE_URL}logo-banner.png`}
                alt="SportsMatch 運對"
                className="h-10 w-auto mb-4"
              />
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                香港最透明、最值得信賴的運動教練審核與搜尋平台。
              </p>
            </div>

            <div className="md:col-span-3 md:col-start-7">
              <h4 className="text-sm font-semibold text-foreground mb-4">支援</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="/faq" className="text-muted-foreground hover:text-primary transition-colors">
                    常見問題
                  </a>
                </li>
              </ul>
            </div>

            <div className="md:col-span-3">
              <h4 className="text-sm font-semibold text-foreground mb-4">法律條款</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="/legal" className="text-muted-foreground hover:text-primary transition-colors">
                    條款及細則
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t text-xs text-muted-foreground">
            © {new Date().getFullYear()} 運對 SportsMatch HK. All rights reserved.
          </div>
        </div>
      </footer>
      <SupportWidget />
    </div>
  );
}
