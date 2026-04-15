import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MessageCircle, X, ChevronRight } from "lucide-react";

const FAQS = [
  {
    q: "平台係免費嘅嗎？",
    a: "係嘅！搜尋同聯絡教練完全免費。所有學費直接俾教練，本平台唔抽佣。",
  },
  {
    q: "教練係點樣審核嘅？",
    a: "每位教練嘅資歷同教練資格都會由我哋團隊人手審核，通過後先會顯示「已認證」標誌。",
  },
  {
    q: "點樣預約體驗堂？",
    a: "直接喺教練檔案上撳「WhatsApp 聯絡教練」按鈕，用WhatsApp直接溝通約堂。",
  },
  {
    q: "如果教練有問題點算？",
    a: "可以喺教練檔案頁面下方撳「舉報教練」，我哋會盡快跟進處理。",
  },
  {
    q: "教練可以點樣登記？",
    a: "登入後撳導航列嘅「我是教練」，填寫資料後送審，通常1-3個工作天內完成審核。",
  },
];

export function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <Card className="w-80 shadow-2xl border-2 border-primary/20 animate-in slide-in-from-bottom-4 fade-in">
          <CardHeader className="p-4 pb-3 bg-primary rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary-foreground" />
                <div>
                  <p className="font-bold text-sm text-primary-foreground">運對客服</p>
                  <p className="text-xs text-primary-foreground/70">常見問題 · 即時解答</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-primary-foreground/70 hover:text-primary-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-3 bg-yellow-50 border-b">
              <p className="text-xs text-muted-foreground">👋 有咩可以幫到你？</p>
            </div>
            <div className="divide-y max-h-72 overflow-y-auto">
              {FAQS.map((faq, i) => (
                <div key={i}>
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-yellow-50/50 transition-colors">
                    <span className="text-sm font-medium pr-2">{faq.q}</span>
                    <ChevronRight className={`h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform ${expandedFaq === i ? "rotate-90" : ""}`} />
                  </button>
                  {expandedFaq === i && (
                    <div className="px-3 pb-3 text-xs text-muted-foreground bg-yellow-50/30 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="p-3 border-t bg-muted/30">
              <p className="text-xs text-muted-foreground text-center">
                仍有疑問？
                <a href="mailto:hello@sportsmatch.hk" className="text-primary font-medium ml-1">電郵我哋</a>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center">
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
