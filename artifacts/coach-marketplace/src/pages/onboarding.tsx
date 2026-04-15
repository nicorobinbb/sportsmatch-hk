import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@clerk/react";
import { getBaseUrl } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-token";
import { CheckCircle2 } from "lucide-react";

const SPORTS = [
  { name: "游泳", emoji: "🏊" },
  { name: "瑜伽", emoji: "🧘" },
  { name: "普拉提", emoji: "🤸" },
  { name: "足球", emoji: "⚽" },
  { name: "籃球", emoji: "🏀" },
  { name: "網球", emoji: "🎾" },
  { name: "羽毛球", emoji: "🏸" },
  { name: "拳擊", emoji: "🥊" },
  { name: "跑步", emoji: "🏃" },
  { name: "舞蹈", emoji: "💃" },
  { name: "高爾夫球", emoji: "⛳" },
  { name: "劍擊", emoji: "🤺" },
  { name: "田徑", emoji: "🏅" },
  { name: "乒乓球", emoji: "🏓" },
  { name: "跆拳道", emoji: "🥋" },
  { name: "排球", emoji: "🏐" },
];

const GOALS = [
  { id: "weight_loss", emoji: "💪", label: "減重塑形", desc: "健康瘦身、改善體態" },
  { id: "muscle_gain", emoji: "🏋️", label: "增肌強壯", desc: "增加肌肉量、體能訓練" },
  { id: "competition", emoji: "🏆", label: "備戰比賽", desc: "學界、業餘或專業賽事" },
  { id: "fitness", emoji: "❤️", label: "提升健康", desc: "改善體能、心肺功能" },
  { id: "skill", emoji: "🎯", label: "學習技術", desc: "掌握新技能、提升水平" },
  { id: "fun", emoji: "🎉", label: "興趣娛樂", desc: "享受運動樂趣" },
  { id: "rehab", emoji: "🌿", label: "康復調理", desc: "運動傷患復健" },
];

const STEPS = [
  { id: 1, title: "您好，請告訴我們您的姓名", subtitle: "方便我們為您提供個人化體驗" },
  { id: 2, title: "您喜愛哪些運動？", subtitle: "可多選，我們用此為您推薦合適教練" },
  { id: 3, title: "您的訓練目標是？", subtitle: "選擇目標幫助我們配對最合適的教練（可多選）" },
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nameError, setNameError] = useState("");
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [, navigate] = useLocation();
  const { user } = useUser();

  const toggle = (arr: string[], setArr: (v: string[]) => void, val: string) =>
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);

  const progress = (step / STEPS.length) * 100;

  const handleNext = () => {
    if (step === 1) {
      if (!firstName.trim() || !lastName.trim()) {
        setNameError("請輸入您的姓氏及名字");
        return;
      }
      setNameError("");
    }
    setStep(s => s + 1);
  };

  async function finish() {
    setSaving(true);
    try {
      const token = await getAuthToken();
      await fetch(`${getBaseUrl()}/api/user/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          preferredSports: selectedSports,
          goals: selectedGoals,
          onboardingCompleted: true,
        }),
      });
      navigate("/");
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

  const currentStep = STEPS[step - 1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-base shadow-md">運</div>
            <span className="text-xl font-bold font-display">運對</span>
          </div>
          <p className="text-muted-foreground text-sm">
            {user?.firstName ? `歡迎，${user.firstName}！` : "歡迎加入！"} 先讓我們了解您一下 👋
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>步驟 {step} / {STEPS.length}</span>
            <span>{Math.round(progress)}% 完成</span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-border/50 p-7">
          <h2 className="text-xl font-bold font-display mb-1">{currentStep.title}</h2>
          <p className="text-sm text-muted-foreground mb-6">{currentStep.subtitle}</p>

          {/* Step 1 — Name */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">姓氏</Label>
                  <Input
                    id="lastName"
                    placeholder="例：陳"
                    value={lastName}
                    onChange={e => { setLastName(e.target.value); setNameError(""); }}
                    className="h-11"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">名字</Label>
                  <Input
                    id="firstName"
                    placeholder="例：大文"
                    value={firstName}
                    onChange={e => { setFirstName(e.target.value); setNameError(""); }}
                    className="h-11"
                    onKeyDown={e => e.key === "Enter" && handleNext()}
                  />
                </div>
              </div>
              {nameError && <p className="text-sm text-destructive">{nameError}</p>}
              {firstName && lastName && (
                <div className="flex items-center gap-2 text-sm text-primary bg-primary/5 rounded-lg px-3 py-2">
                  <CheckCircle2 className="w-4 h-4" />
                  您好，{lastName}{firstName}！
                </div>
              )}
            </div>
          )}

          {/* Step 2 — Sports */}
          {step === 2 && (
            <div className="grid grid-cols-3 gap-2">
              {SPORTS.map(sport => {
                const selected = selectedSports.includes(sport.name);
                return (
                  <button
                    key={sport.name}
                    type="button"
                    onClick={() => toggle(selectedSports, setSelectedSports, sport.name)}
                    className={`relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-sm font-medium transition-all ${
                      selected
                        ? "bg-primary border-primary text-primary-foreground shadow-sm"
                        : "bg-white border-border text-foreground hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    {selected && (
                      <CheckCircle2 className="absolute top-1.5 right-1.5 w-3 h-3 text-primary-foreground/80" />
                    )}
                    <span className="text-2xl leading-none">{sport.emoji}</span>
                    <span className="text-xs">{sport.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 3 — Goals */}
          {step === 3 && (
            <div className="space-y-2.5">
              {GOALS.map(g => {
                const selected = selectedGoals.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggle(selectedGoals, setSelectedGoals, g.id)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                      selected
                        ? "bg-primary border-primary shadow-sm"
                        : "bg-white border-border hover:border-primary/40 hover:bg-primary/5"
                    }`}
                  >
                    <span className="text-xl shrink-0">{g.emoji}</span>
                    <div className="flex-1">
                      <div className={`font-semibold text-sm ${selected ? "text-primary-foreground" : "text-foreground"}`}>{g.label}</div>
                      <div className={`text-xs mt-0.5 ${selected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{g.desc}</div>
                    </div>
                    {selected && <CheckCircle2 className="w-4 h-4 text-primary-foreground/80 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-5">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="px-5 h-11">
              ← 返回
            </Button>
          )}
          {step < STEPS.length ? (
            <Button onClick={handleNext} className="flex-1 h-11 font-bold">
              繼續 →
            </Button>
          ) : (
            <Button onClick={finish} disabled={saving} className="flex-1 h-11 font-bold">
              {saving ? "儲存中…" : selectedGoals.length === 0 ? "略過，完成設定" : "完成設定 🎉"}
            </Button>
          )}
        </div>

        <button
          onClick={skip}
          className="w-full mt-4 text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          跳過，直接瀏覽
        </button>
      </div>
    </div>
  );
}
