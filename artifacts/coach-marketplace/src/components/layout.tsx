import { Link } from "wouter";
import { Navbar } from "./navbar";
import { SupportWidget } from "./support-widget";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-background">
      <Navbar />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <footer className="bg-primary text-white">
        <div className="container px-4 md:px-10 py-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
            <div className="md:col-span-5">
              <img
                src={`${import.meta.env.BASE_URL}logo-footer.png`}
                alt="SportsMatch 運對 — 香港運動教練配對平台"
                className="h-16 w-auto mb-4"
              />
              <p className="text-sm text-white/85 leading-relaxed max-w-sm">
                香港最透明、最值得信賴的運動教練審核與搜尋平台。
              </p>
            </div>

            <div className="md:col-span-2 md:col-start-6">
              <h4 className="text-sm font-semibold text-white mb-4">關於我們</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/about" className="text-white/85 hover:text-white transition-colors">
                    關於我們
                  </Link>
                </li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h4 className="text-sm font-semibold text-white mb-4">支援</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/faq" className="text-white/85 hover:text-white transition-colors">
                    常見問題
                  </Link>
                </li>
              </ul>
            </div>

            <div className="md:col-span-3">
              <h4 className="text-sm font-semibold text-white mb-4">法律條款</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/terms" className="text-white/85 hover:text-white transition-colors">
                    條款及細則
                  </Link>
                </li>
                <li>
                  <Link href="/disclaimer" className="text-white/85 hover:text-white transition-colors">
                    免責聲明
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-white/85 hover:text-white transition-colors">
                    隱私權政策
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm">
            <span className="font-semibold text-white">合作與查詢：</span>{" "}
            <a
              href="mailto:info@sportsmatch-hk.com"
              className="text-white underline underline-offset-2 hover:text-white/85 transition-colors"
            >
              info@sportsmatch-hk.com
            </a>
            <span className="text-white/85">（教練查詢 / 廣告合作）</span>
          </div>

          <div className="mt-10 pt-6 border-t border-white/20 text-xs text-white/80">
            © {new Date().getFullYear()} 運對 SportsMatch HK. All rights reserved.
          </div>
        </div>
      </footer>
      <SupportWidget />
    </div>
  );
}
