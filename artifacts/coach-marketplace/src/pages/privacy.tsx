import { Layout } from "@/components/layout";

export default function Privacy() {
  return (
    <Layout>
      <div className="container max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">隱私權政策</h1>
        <p className="text-sm text-muted-foreground mb-8">最後更新日期：2026年4月17日</p>

        <p className="text-muted-foreground leading-relaxed mb-10">
          SportsMatch（下稱「本平台」）非常重視您的個人資料私隱。本政策旨在說明我們如何收集、使用及處理用戶資料。
        </p>

        <div className="space-y-10 text-foreground">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. 個人資料之收集類別</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              當您在 SportsMatch 註冊帳戶、填寫運動偏好問卷或與我們聯絡時，我們可能會收集以下資料：
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
              <li>
                <span className="font-medium text-foreground">基本識別資料：</span>
                姓名、聯絡電話、電郵地址、性別、出生年份。
              </li>
              <li>
                <span className="font-medium text-foreground">導師專業資歷（僅限教練）：</span>
                專業證書副本、個人簡介、教學經驗、運動相關影片及相片、SCRC 查核編號及結果。
              </li>
              <li>
                <span className="font-medium text-foreground">教學需求與偏好（僅限學員）：</span>
                運動目標（如減肥、增肌）、感興趣的運動項目、上課地區偏好、空閒時間段。
              </li>
              <li>
                <span className="font-medium text-foreground">技術數據：</span>
                IP 地址、設備資訊、App 內的使用行為紀錄。
              </li>
            </ul>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3 italic">
              註：本平台不會要求、收集或儲存您的香港身份證副本。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. 使用個人資料之目的</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
              <li>
                <span className="font-medium text-foreground">核心配對服務：</span>
                協助學員搜尋合適教練。
              </li>
              <li>
                <span className="font-medium text-foreground">資歷核實：</span>
                利用 AI 及行政手段核實教練身分及專業資格。
              </li>
              <li>
                <span className="font-medium text-foreground">CRM 與個人化體驗：</span>
                根據您的偏好推送合適的教練推薦或運動資訊。
              </li>
              <li>
                <span className="font-medium text-foreground">市場分析與廣告：</span>
                進行匿名化的數據統計（如各區運動需求分析），以優化平台服務及向合作夥伴提供市場趨勢分析。
              </li>
              <li>
                <span className="font-medium text-foreground">客戶服務：</span>
                處理舉報、糾紛及技術支援。
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. 個人資料的轉移與披露</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              我們承諾不會將您的個人資料出售予第三方。但在以下情況下可能披露資料：
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
              <li>
                <span className="font-medium text-foreground">配對對象確認：</span>
                當學員主動聯絡教練時，相關聯絡資料將會披露予對方。
              </li>
              <li>
                <span className="font-medium text-foreground">法律強制要求：</span>
                因應法庭命令或政府部門（如警方）的合法要求。
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. 資料安全與風險管理</h2>
            <p className="text-muted-foreground leading-relaxed">
              所有敏感資料（特別是 SCRC 編號及證書）均儲存於受加密保護的雲端系統中，並僅由獲得授權的內部人員在核實身分時查閱。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. 資料保留政策</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
              <li>當用戶要求註銷帳號後，我們將在 90 天內刪除或匿名化處理相關個人資料。</li>
              <li>
                若帳號因嚴重違反服務條款（如涉嫌詐騙或騷擾）而被封鎖，我們保留記錄相關資料以防止該用戶重新註冊的權利。
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. 用戶權利</h2>
            <p className="text-muted-foreground leading-relaxed">
              根據《個人資料（私隱）條例》，您有權要求查閱或更正本平台持有的您的個人資料。如需行使此權利，請透過 App 內的「聯繫我們」功能提交申請。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. 政策修改</h2>
            <p className="text-muted-foreground leading-relaxed">
              SportsMatch 保留隨時修訂本政策之權利。修訂後之版本將刊登於本網頁並標明更新日期。
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
