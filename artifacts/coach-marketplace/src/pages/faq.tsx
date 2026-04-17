import { Layout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HelpCircle, Users, Trophy, MessageCircle, Sparkles } from "lucide-react";

type FaqItem = { q: string; a: string };

const STUDENT_FAQS: FaqItem[] = [
  {
    q: "使用 SportsMatch 搵教練需要向平台支付費用嗎？",
    a: "完全免費！學員搜尋教練、查看評價及直接聯絡教練都不需要向平台支付任何費用。",
  },
  {
    q: "如何知道教練是否可靠？",
    a: "平台要求教練提供專業證書及 SCRC（性罪行查核）。通過審核的教練會有「已認證」標章，你亦可以參考真實評分。",
  },
  {
    q: "如果有糾紛，平台會處理嗎？",
    a: "SportsMatch 係資訊配對平台，不參與交易。建議雙方先傾好退款安排，如有違規請即時「舉報」。",
  },
];

const COACH_FAQS: FaqItem[] = [
  {
    q: "喺 SportsMatch 上架需要付費嗎？",
    a: "完全免費！我們歡迎所有教練免費註冊及建立個人檔案。",
  },
  {
    q: "既然唔抽佣，平台靠咩營運？",
    a: "我哋向需要額外曝光嘅教練提供「置頂推廣」服務，教練可自由選擇是否購買。",
  },
  {
    q: "如何可以令我個個人檔案排名更高？",
    a: "除了廣告，你嘅回覆速度、學員評分、資歷完整度都會影響排名。",
  },
];

function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <Accordion type="single" collapsible className="w-full space-y-3">
      {items.map((item, i) => (
        <AccordionItem
          key={i}
          value={`item-${i}`}
          className="border rounded-2xl bg-white px-5 shadow-sm hover:shadow-md transition-shadow data-[state=open]:border-primary/40 data-[state=open]:shadow-md"
        >
          <AccordionTrigger className="text-left py-4 hover:no-underline gap-4">
            <div className="flex items-start gap-3 flex-1">
              <span className="shrink-0 mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-xs">
                Q
              </span>
              <span className="font-semibold text-base text-foreground">{item.q}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-5 pl-10 pr-2 text-muted-foreground leading-relaxed text-[15px]">
            {item.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export default function Faq() {
  const openSupport = () => {
    window.dispatchEvent(new CustomEvent("sportsmatch:open-support"));
  };

  return (
    <Layout>
      {/* Header section */}
      <section className="bg-primary/5 border-b">
        <div className="container max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            常見問題
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            有問題？我哋幫你解答
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            揀返你嘅身份，搵啱你想知嘅答案 ✨
          </p>
        </div>
      </section>

      {/* Tabs section */}
      <section className="container max-w-3xl mx-auto px-4 md:px-6 py-10 md:py-12">
        <Tabs defaultValue="student" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-auto p-1.5 rounded-2xl bg-muted/60 mb-8">
            <TabsTrigger
              value="student"
              className="rounded-xl py-3 px-4 text-sm md:text-base font-semibold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              學員 / 家長
            </TabsTrigger>
            <TabsTrigger
              value="coach"
              className="rounded-xl py-3 px-4 text-sm md:text-base font-semibold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md flex items-center gap-2"
            >
              <Trophy className="w-4 h-4" />
              運動教練
            </TabsTrigger>
          </TabsList>

          <TabsContent value="student" className="mt-0 focus-visible:outline-none">
            <FaqList items={STUDENT_FAQS} />
          </TabsContent>

          <TabsContent value="coach" className="mt-0 focus-visible:outline-none">
            <FaqList items={COACH_FAQS} />
          </TabsContent>
        </Tabs>

        {/* Contact support card */}
        <Card className="mt-12 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl">
          <CardContent className="p-6 md:p-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground mb-4 shadow-md">
              <HelpCircle className="w-7 h-7" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
              仲有疑問？
            </h2>
            <p className="text-muted-foreground mb-6 text-sm md:text-base">
              我哋嘅 AI 客服 24 小時為你解答 — 即時、貼心、唔洗等。
            </p>
            <Button
              size="lg"
              onClick={openSupport}
              className="rounded-full px-8 font-bold shadow-md"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              聯絡支援
            </Button>
          </CardContent>
        </Card>
      </section>
    </Layout>
  );
}
