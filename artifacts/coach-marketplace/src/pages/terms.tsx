import { Layout } from "@/components/layout";

export default function Terms() {
  return (
    <Layout>
      <div className="container max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          SportsMatch 運對 — 服務條款及細則
        </h1>
        <p className="text-sm text-muted-foreground mb-10">最後更新日期：2026年4月17日</p>

        <div className="space-y-10 text-foreground">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. 服務總綱與平台角色</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              SportsMatch（下稱「本平台」）是一個提供運動教育資訊配對服務的網上平台。本平台旨在協助客戶（家長／學生／運動員）尋找合適的運動教練。
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
              <li>
                <span className="font-medium text-foreground">非中介關係：</span>
                本平台與教練之間不構成僱傭、合夥、合約或代理關係。
              </li>
              <li>
                <span className="font-medium text-foreground">交易免責：</span>
                所有的教學活動、課堂安排及學費支付均由用戶與教練直接協商，本平台不參與其中。
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. 用戶註冊與帳戶安全</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
              <li>用戶須提供真實、準確及最新的個人資料。</li>
              <li>
                <span className="font-medium text-foreground">教練審核：</span>
                本平台以人手查核實教練提供的資歷證明（如證書、SCRC 性罪行定罪紀錄查核）。
              </li>
              <li>
                用戶不得冒用他人身份或提供虛假資歷，一經發現，本平台有權永久封鎖該帳戶。
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. 費用說明</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
              <li>
                <span className="font-medium text-foreground">學員：</span>
                學員使用本平台搜尋、配對教練完全免費。
              </li>
              <li>
                <span className="font-medium text-foreground">教練端：</span>
                基本刊登可能免費，但若涉及「置頂功能」、「廣告推廣」或其他增值服務，教練須根據相關頁面說明支付費用。
              </li>
              <li>
                <span className="font-medium text-foreground">退款政策：</span>
                所有支付予本平台的廣告或服務費用一經確認，恕不退還。
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. 課堂規範與糾紛處理</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
              <li>
                <span className="font-medium text-foreground">課堂變更：</span>
                任何課堂變更或取消應由學員與教練直接溝通。建議雙方於課堂開始前最少 24 小時提出。
              </li>
              <li>
                <span className="font-medium text-foreground">免責聲明：</span>
                對於教學期間發生的任何意外、財物損失、人身傷害或刑事爭議，本平台概不承擔任何法律責任。建議用戶自行購買相關運動保險。
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. 評價與誠信系統</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
              <li>用戶可對教練進行真實評分及評價。</li>
              <li>
                嚴禁蓄意抹黑、洗板或發佈虛假評論。本平台保留刪除不當言論及追究責任的權利。
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. 知識產權</h2>
            <p className="text-muted-foreground leading-relaxed">
              本平台所有內容（包括商標、標誌、專利設計、文字、圖像）均屬 SportsMatch 所有。未經書面許可，嚴禁轉載、複製或作商業用途。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. 司法管轄權</h2>
            <p className="text-muted-foreground leading-relaxed">
              本條款受香港特別行政區法律管轄。如有任何爭議，雙方同意接受香港法院之專屬管轄權。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. 修改與最終解釋權</h2>
            <p className="text-muted-foreground leading-relaxed">
              SportsMatch 保留隨時修改本條款之權利，修改後將於平台公佈。如有任何爭議，SportsMatch 保留最終決定權。
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
