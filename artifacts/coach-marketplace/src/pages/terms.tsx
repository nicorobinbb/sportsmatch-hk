import { Layout } from "@/components/layout";

export default function Terms() {
  return (
    <Layout>
      <div className="container max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">條款及細則</h1>
        <p className="text-sm text-muted-foreground mb-10">
          最後更新：{new Date().toLocaleDateString("zh-HK", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <div className="prose prose-slate max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. 簡介</h2>
            <p className="text-muted-foreground leading-relaxed">
              條款內容稍後提供。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. 服務範圍</h2>
            <p className="text-muted-foreground leading-relaxed">
              條款內容稍後提供。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. 用戶責任</h2>
            <p className="text-muted-foreground leading-relaxed">
              條款內容稍後提供。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. 教練責任</h2>
            <p className="text-muted-foreground leading-relaxed">
              條款內容稍後提供。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. 免責聲明</h2>
            <p className="text-muted-foreground leading-relaxed">
              條款內容稍後提供。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. 聯絡我們</h2>
            <p className="text-muted-foreground leading-relaxed">
              如有任何疑問，請透過網站右下角的支援按鈕聯絡我們。
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
