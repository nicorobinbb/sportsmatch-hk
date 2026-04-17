import { Layout } from "@/components/layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { HelpCircle, Sparkles, MessageCircle } from "lucide-react";

type FaqItem = { q: string; a: string };

const FAQS: FaqItem[] = [
  {
    q: "SportsMatch 運對是什麼？",
    a: "SportsMatch 是全港首個資訊最透明的運動教練配對平台。我們不設抽佣機制，亦不收取中介費用，旨在讓學員直接尋找最合適的教練，同時為教練提供公平的曝光機會。",
  },
  {
    q: "教練的資歷是否經過核實？",
    a: "是的。我們會要求教練提供專業證書及 SCRC（性罪行定罪紀錄）查核編號。通過審核的教練將獲得「已認證」標章。用戶亦可參考其他學員的真實評分作為參考。",
  },
  {
    q: "若認為教練不合適，可以更換嗎？",
    a: "當然可以。由於學員是直接與教練聯繫及授課，您可以隨時在平台尋找其他教練。我們亦鼓勵您在平台上「檢舉」任何不專業或與資歷不符的行為，以維持社區質素。",
  },
  {
    q: "如何支付學費？",
    a: "SportsMatch 不會經手任何學費交易。您可以與教練直接商議支付方式（如轉數快、銀行轉帳或現金）。這樣能確保教練收到足額學費，而您亦無需支付額外行政費。",
  },
  {
    q: "課堂可以改期或取消嗎？",
    a: "課堂安排（包括改期或取消政策）由教練與學員直接商定。我們建議雙方在確認首堂課程前，先溝通清楚相關守則，以保障雙方利益。",
  },
  {
    q: "使用 SportsMatch 需要支付行政費嗎？",
    a: "學員費用全免。由於我們不實行抽佣制度，學員直接與教練交易即可。我們僅向需要額外推廣位置的教練收取少量的廣告費用。",
  },
  {
    q: "如何成為 SportsMatch 的教練？",
    a: "請點擊「成為教練」並註冊帳戶，上載您的專長及資歷證明。經過行政人員審核後，您的個人檔案將會正式公開。",
  },
  {
    q: "教練與平台之間是什麼關係？",
    a: "SportsMatch 僅為資訊配對平台。教練與本平台之間並不構成僱傭或代理關係。教練可自主決定收費及教學內容，並對其教學質素負上全部責任。",
  },
];

export default function Faq() {
  const openSupport = () => {
    window.dispatchEvent(new CustomEvent("sportsmatch:open-support"));
  };

  return (
    <Layout>
      <div className="bg-[#f8f9fa] min-h-screen">
        {/* Header */}
        <section className="container max-w-3xl mx-auto px-4 md:px-6 pt-12 md:pt-16 pb-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            常見問題
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-3 font-display">
            有問題？我們為您解答
          </h1>
          <p className="text-gray-600 text-base md:text-lg">
            關於 SportsMatch 運對，您想知道的一切
          </p>
        </section>

        {/* Accordion list */}
        <section className="container max-w-3xl mx-auto px-4 md:px-6 pb-10">
          <Accordion type="single" collapsible className="w-full space-y-3">
            {FAQS.map((item, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border border-gray-200 rounded-xl bg-white px-5 md:px-6 shadow-sm hover:shadow-md transition-shadow data-[state=open]:shadow-md"
              >
                <AccordionTrigger className="text-left py-5 hover:no-underline gap-4 [&[data-state=open]>svg]:text-primary">
                  <span className="font-semibold text-base md:text-lg text-gray-900 flex-1">
                    {item.q}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-gray-700 leading-relaxed text-[15px] md:text-base">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Contact footer */}
        <section className="container max-w-3xl mx-auto px-4 md:px-6 pb-16">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 md:p-10 text-center shadow-sm">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary mb-4">
              <HelpCircle className="w-7 h-7" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              仍有其他疑問？
            </h2>
            <p className="text-gray-600 mb-6 text-sm md:text-base">
              我們的支援團隊將竭誠為您解答。
            </p>
            <Button
              size="lg"
              onClick={openSupport}
              className="rounded-full px-8 font-bold shadow-md"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              聯絡我們
            </Button>
          </div>
        </section>
      </div>
    </Layout>
  );
}
