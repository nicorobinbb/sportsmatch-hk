import { Layout } from "@/components/layout";

export default function Disclaimer() {
  return (
    <Layout>
      <div className="container max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">免責聲明</h1>
        <p className="text-sm text-muted-foreground mb-10">最後更新日期：2026年4月17日</p>

        <div className="space-y-10 text-foreground">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. 平台服務性質</h2>
            <p className="text-muted-foreground leading-relaxed">
              SportsMatch 僅作為一個資訊媒合平台，旨在協助教練與學員進行初步對接。本平台並不僱用任何教練，亦不參與雙方的教學過程。本平台與教練之間不構成僱傭、合夥、合資或代理關係。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. 資訊準確性與 AI 核實</h2>
            <p className="text-muted-foreground leading-relaxed">
              雖然本平台已利用 AI 技術及人工行政審核盡力核實教練提交之證書及資歷（如 SCRC），但並不保證該等資料之絕對真實性、準確性或完整性。用戶在聘用教練前，應自行判斷及要求教練出示相關證明文件正本。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. 教學活動與人身安全</h2>
            <p className="text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">運動具有一定風險。</span>{" "}
              無論教學活動於學生家中、教練場地、公共空間或任何第三方場地進行，其環境安全性及相關運動風險（包括但不限於受傷、身體不適或意外亡）均由教練與學員雙方自行承擔。本平台概不負責。建議用戶自行購買合適的個人意外保險。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. 交易與支付風險</h2>
            <p className="text-muted-foreground leading-relaxed">
              本平台不參與學員與教練之間的學費支付過程。用戶與教練之間的任何金錢交易（包括支付方式、退款協議或補課安排）均屬雙方之私人協議。若發生經濟損失或詐騙行為，本平台不承擔任何賠償責任，但會配合相關執法部門提供必要資料。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. 服務對接責任之終止</h2>
            <p className="text-muted-foreground leading-relaxed">
              當學員透過本平台取得教練聯絡資訊後，本平台之媒合義務即告終結。其後之所有對話、排課及教學細節均由用戶與教練直接溝通，本平台不會對雙方的後續行為負責。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. 技術免責與數據風險</h2>
            <p className="text-muted-foreground leading-relaxed">
              本平台不保證服務不會受到干擾或出現錯誤。用戶須理解透過互聯網傳輸資料之風險，如因技術故障導致資料遺失或流出，本平台在法律允許的最大範圍內免除責任。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. 修改與解釋權</h2>
            <p className="text-muted-foreground leading-relaxed">
              SportsMatch 保留隨時修改本免責聲明之權利。如有任何爭議，SportsMatch 保留最終決定權。
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
