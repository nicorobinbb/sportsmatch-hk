import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUser } from "@clerk/react";
import { getBaseUrl } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-token";

const SPORTS = ["游泳", "瑜伽", "籃球", "網球", "拳擊", "普拉提", "足球", "羽毛球", "跑步", "舞蹈", "高爾夫球", "乒乓球", "體操", "跆拳道", "空手道", "排球", "劍擊", "個人訓練", "田徑"];

const GOALS = [
  { id: "weight_loss", label: "💪 減重塑形", desc: "健康瘦身、改善體態" },
  { id: "muscle_gain", label: "🏋️ 增肌強壯", desc: "增加肌肉量、體能訓練" },
  { id: "competition", label: "🏆 備戰比賽", desc: "學界、業餘或專業賽事" },
  { id: "fitness", label: "❤️ 提升健康", desc: "改善體能、心肺功能" },
  { id: "skill", label: "🎯 學習技術", desc: "掌握新技能、提升水平" },
  { id: "fun", label: "🎉 興趣娛樂", desc: "享受運動樂趣" },
  { id: "rehab", label: "🌿 康復調理", desc: "運動傷患復健" },
];

const AVAILABILITY = [
  { id: "weekday_morning", label: "☀️ 平日早上", desc: "09:00 – 12:00" },
  { id: "weekday_afternoon", label: "🌤 平日下午", desc: "12:00 – 18:00" },
  { id: "weekday_evening", label: "🌙 平日晚上", desc: "18:00 – 22:00" },
  { id: "weekend_morning", label: "🌅 週末早上", desc: "09:00 – 12:00" },
  { id: "weekend_afternoon", label: "🏖 週末下午", desc: "12:00 – 18:00" },
  { id: "weekend_evening", label: "🌆 週末晚上", desc: "18:00 – 22:00" },
];

const DISTRICTS = [
  "中環 / 上環", "灣仔 / 銅鑼灣", "北角 / 鰂魚涌", "西灣河 / 柴灣",
  "旺角 / 油麻地", "尖沙咀 / 佐敦", "九龍城 / 土瓜灣", "觀塘 / 藍田",
  "荃灣 / 葵青", "屯門 / 元朗", "沙田 / 馬鞍山", "將軍澳 / 西貢",
  "大埔 / 粉嶺", "上水 / 粉嶺", "大嶼山 / 東涌",
];

const STEPS = [
  { id: 1, title: "你玩咩運動？", subtitle: "揀選你有興趣的運動項目（可多選）" },
  { id: 2, title: "你的目標係？", subtitle: "我哋會根據你的目標推介合適教練" },
  { id: 3, title: "幾時方便上堂？", subtitle: "選擇你習慣的訓練時間（可多選）" },
  { id: 4, title: "你住邊區？", subtitle: "搵你附近的教練更方便" },
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [, navigate] = useLocation();
  const { user } = useUser();

  const toggle = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const progress = ((step - 1) / STEPS.length) * 100;

  async function finish() {
    setSaving(true);
    try {
      const token = await getAuthToken();
      await fetch(`${getBaseUrl()}/api/user/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          preferredSports: selectedSports,
          goals: selectedGoals,
          availability: selectedTimes,
          preferredDistricts: selectedDistricts,
          onboardingCompleted: true,
        }),
      });
      navigate("/dashboard");
    } catch {
      setSaving(false);
    }
  }

  async function skip() {
    try {
      const token = await getAuthToken();
      await fetch(`${getBaseUrl()}/api/user/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ onboardingCompleted: true }),
      });
    } catch {}
    navigate("/");
  }

  const canNext =
    step === 1 ? selectedSports.length > 0 :
    step === 2 ? selectedGoals.length > 0 :
    step === 3 ? selectedTimes.length > 0 :
    selectedDistricts.length > 0;

  const currentStep = STEPS[step - 1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-50 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">運</div>
            <span className="text-lg font-bold">運對</span>
          </div>
          <p className="text-muted-foreground text-sm">歡迎，{user?.firstName || "新朋友"}！先讓我哋了解你 👋</p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>步驟 {step}/{STEPS.length}</span>
            <span>{Math.round(progress + 25)}% 完成</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress + 25}%` }} />
          </div>
        </div>

        <Card className="p-6 shadow-lg border-2 border-primary/20">
          <h2 className="text-2xl font-bold mb-1">{currentStep.title}</h2>
          <p className="text-sm text-muted-foreground mb-5">{currentStep.subtitle}</p>

          {step === 1 && (
            <div className="flex flex-wrap gap-2">
              {SPORTS.map(s => (
                <button key={s}
                  onClick={() => toggle(selectedSports, setSelectedSports, s)}
                  className={`px-3 py-2 rounded-full text-sm font-medium border transition-all ${selectedSports.includes(s) ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-white border-border hover:border-primary/50"}`}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 gap-3">
              {GOALS.map(g => (
                <button key={g.id}
                  onClick={() => toggle(selectedGoals, setSelectedGoals, g.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selectedGoals.includes(g.id) ? "bg-primary border-primary shadow-sm" : "bg-white border-border hover:border-primary/40"}`}>
                  <span className="text-xl">{g.label.split(" ")[0]}</span>
                  <div>
                    <div className={`font-medium text-sm ${selectedGoals.includes(g.id) ? "text-primary-foreground" : ""}`}>{g.label.split(" ").slice(1).join(" ")}</div>
                    <div className={`text-xs ${selectedGoals.includes(g.id) ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{g.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-1 gap-3">
              {AVAILABILITY.map(a => (
                <button key={a.id}
                  onClick={() => toggle(selectedTimes, setSelectedTimes, a.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${selectedTimes.includes(a.id) ? "bg-primary border-primary shadow-sm" : "bg-white border-border hover:border-primary/40"}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{a.label.split(" ")[0]}</span>
                    <span className={`font-medium text-sm ${selectedTimes.includes(a.id) ? "text-primary-foreground" : ""}`}>{a.label.split(" ").slice(1).join(" ")}</span>
                  </div>
                  <span className={`text-xs ${selectedTimes.includes(a.id) ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{a.desc}</span>
                </button>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-wrap gap-2">
              {DISTRICTS.map(d => (
                <button key={d}
                  onClick={() => toggle(selectedDistricts, setSelectedDistricts, d)}
                  className={`px-3 py-2 rounded-full text-sm font-medium border transition-all ${selectedDistricts.includes(d) ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-white border-border hover:border-primary/50"}`}>
                  {d}
                </button>
              ))}
            </div>
          )}
        </Card>

        <div className="flex gap-3 mt-5">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">上一步</Button>
          )}
          {step < STEPS.length ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canNext} className="flex-1 font-bold">
              下一步 →
            </Button>
          ) : (
            <Button onClick={finish} disabled={!canNext || saving} className="flex-1 font-bold">
              {saving ? "儲存中…" : "完成設定 🎉"}
            </Button>
          )}
        </div>

        <button onClick={skip} className="w-full mt-4 text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          跳過，直接瀏覽
        </button>
      </div>
    </div>
  );
}
