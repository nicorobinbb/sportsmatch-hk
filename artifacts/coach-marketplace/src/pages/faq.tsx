import { Layout } from "@/components/layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { HelpCircle, Sparkles, MessageCircle } from "lucide-react";

type FaqItem = { q: string; a: string };

const FAQS: FaqItem[] = [
  {
    q: "SportsMatch 運對是什麼？",
    a: "SportsMatch 係全港首個資訊最透明嘅運動教練配對平台。我哋唔抽佣、唔收中介費，旨在等學員可以直接搵到最適合嘅教練，同時為教練提供一個公平嘅曝光機會。",
  },
  {
    q: "教練的資歷是否經過核實？",
    a: "係！我哋會要求教練提供專業證書及 SCRC（性罪行定罪紀錄）編號。通過審核嘅教練會有「已認證」標章。用戶亦可以參考其他學員嘅真實評分。",
  },
  {
    q: "如果我覺得教練唔適合，可以換人嗎？",
    a: "當然可以！由於你係直接同教練聯絡及上堂，你可以隨時喺平台搵另一個教練。我哋亦鼓勵你喺平台上「舉報」任何唔專業嘅行為，以維持社區質素。",
  },
  {
    q: "如何支付學費？",
    a: "SportsMatch 唔會經手任何學費交易。你可以同教練直接協議支付方式（如 FPS、轉帳或現金）。咁樣教練可以收到足額學費，而你亦唔使俾額外行政費。",
  },
  {
    q: "課堂可以改期或取消嗎？",
    a: "課堂安排由教練同你直接傾好。我哋建議雙方喺確認第一堂前，先溝通清楚相關守則，以保障雙方利益。",
  },
  {
    q: "使用 SportsMatch 要俾行政費嗎？",
    a: "學員係完全免費嘅！由於我哋唔行抽佣制度，你直接同教練交易即可。我哋只會向需要額外推廣位嘅教練收取廣告費用。",
  },
  {
    q: "如何成為 SportsMatch 的教練？",
    a: "點擊「成為教練」並註冊帳戶，上傳資歷證明。經過我哋行政人員審核後，你嘅檔案就會正式公開。",
  },
  {
    q: "教練與平台是什麼關係？",
    a: "SportsMatch 僅為資訊配對平台。教練與本平台之間唔構成僱傭關係。教練可以自主決定收費及教學內容，並對其教學品質負全責。",
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
            有問題？我哋幫你解答
          </h1>
          <p className="text-gray-600 text-base md:text-lg">
            關於 SportsMatch 運對你想知嘅一切
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
              仲有疑問？
            </h2>
            <p className="text-gray-600 mb-6 text-sm md:text-base">
              我哋嘅支援團隊隨時為你解答。
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
