import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useCoachStatus } from "@/hooks/use-coach-status";
import { useAuth } from "@/hooks/use-auth";
import { getBaseUrl } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-token";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Loader2, 
  Plus, 
  Trash2, 
  Award,
  CheckCircle2,
  Clock
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Pricing row type
type PricingRow = { 
  id: string; 
  sessionType: "單對單" | "小組課堂"; 
  price: string; 
  minStudents: string; 
  maxStudents: string; 
  duration: string; 
  ageGroup?: string 
};

const AGE_GROUP_PRICING_OPTIONS = ["幼童（8歲以下）", "兒童（8至12歲）", "青少年（12-17歲）", "成人（18歲以上）", "長者（60歲以上）"];
const HK_DISTRICTS = [
  "中西區", "灣仔", "東區", "南區",
  "油尖旺", "深水埗", "九龍城", "黃大仙", "觀塘",
  "葵青", "荃灣", "屯門", "元朗", "北區", "大埔", "沙田", "西貢", "離島",
];

interface MyCoach {
  id: number;
  name: string;
  sportsCategory: string;
  location: string;
  bio: string;
  isApproved: boolean;
  pendingEdits: string | null;
  profileImageUrl?: string | null;
  experienceLevel?: string;
  ageGroups?: string[];
  teachingFocus?: string[];
  whatsappNumber?: string | null;
  pricingPlans?: string | null;
  packageDetails?: string | null;
  qualifications?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
  websiteUrl?: string | null;
  scrcNumber?: string | null;
  teachingAchievements?: string | null;
  sportsAchievements?: string | null;
}

export default function CoachEditPage() {
  const { id } = useParams();
  const coachId = parseInt(id || "0");
  const { isSignedIn, isAuthLoading } = useAuth();
  const { data: coachStatus, refetch: refetchCoachStatus } = useCoachStatus();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const [coach, setCoach] = useState<MyCoach | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [scrcNumber, setScrcNumber] = useState("");
  const [teachingAchievements, setTeachingAchievements] = useState("");
  const [sportsAchievements, setSportsAchievements] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [packageDetails, setPackageDetails] = useState("");
  const [pricingRows, setPricingRows] = useState<PricingRow[]>([]);
  const [ageGroups, setAgeGroups] = useState<string[]>([]);
  const [teachingFocus, setTeachingFocus] = useState<string[]>([]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isSignedIn) {
      navigate("/sign-in?redirect=/coach-portal");
      return;
    }
    if (coachStatus?.coaches) {
      const found = coachStatus.coaches.find(c => c.id === coachId);
      if (found) {
        setCoach(found);
        initializeForm(found);
      } else {
        navigate("/coach-portal");
      }
    }
    setLoading(false);
  }, [isSignedIn, isAuthLoading, coachStatus, coachId]);

  function initializeForm(coach: MyCoach) {
    setName(coach.name);
    setBio(coach.bio || "");
    setLocation(coach.location ? coach.location.split("、") : []);
    setExperienceLevel(coach.experienceLevel || "");
    setWhatsappNumber(coach.whatsappNumber || "");
    setFacebookUrl(coach.facebookUrl || "");
    setInstagramUrl(coach.instagramUrl || "");
    setWebsiteUrl(coach.websiteUrl || "");
    setScrcNumber(coach.scrcNumber || "");
    setTeachingAchievements(coach.teachingAchievements || "");
    setSportsAchievements(coach.sportsAchievements || "");
    setQualifications(coach.qualifications || "[]");
    setPackageDetails(coach.packageDetails || "");
    setAgeGroups(coach.ageGroups || []);
    setTeachingFocus(coach.teachingFocus || []);
    
    // Parse pricing plans
    try {
      const plans = coach.pricingPlans ? JSON.parse(coach.pricingPlans) : [];
      if (Array.isArray(plans) && plans.length > 0) {
        setPricingRows(plans.map((p: any) => ({
          id: crypto.randomUUID(),
          sessionType: p.sessionType || '單對單',
          price: String(p.price || ''),
          minStudents: String(p.minStudents || ''),
          maxStudents: String(p.maxStudents || ''),
          duration: p.duration || '',
          ageGroup: p.ageGroup || '',
        })));
      } else {
        setPricingRows([newPricingRow()]);
      }
    } catch {
      setPricingRows([newPricingRow()]);
    }
  }

  const newPricingRow = (): PricingRow => ({ 
    id: crypto.randomUUID(), 
    sessionType: "單對單", 
    price: "", 
    minStudents: "", 
    maxStudents: "", 
    duration: "", 
    ageGroup: "" 
  });

  const updatePricingRow = (id: string, patch: Partial<PricingRow>) =>
    setPricingRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));

  const removePricingRow = (id: string) =>
    setPricingRows(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : prev);

  const addPricingRow = () =>
    setPricingRows(prev => [...prev, newPricingRow()]);

  const toggleDistrict = (district: string) => {
    setLocation(prev => 
      prev.includes(district) 
        ? prev.filter(d => d !== district)
        : [...prev, district]
    );
  };

  const toggleAgeGroup = (age: string) => {
    setAgeGroups(prev => 
      prev.includes(age) 
        ? prev.filter(a => a !== age)
        : [...prev, age]
    );
  };

  const toggleTeachingFocus = (focus: string) => {
    setTeachingFocus(prev => 
      prev.includes(focus) 
        ? prev.filter(f => f !== focus)
        : [...prev, focus]
    );
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!coach) return;
    
    setSubmitting(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${getBaseUrl()}/api/coaches/${coach.id}/edit-request`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name,
          bio,
          location: location.join("。") ,
          experienceLevel,
          whatsappNumber: whatsappNumber || undefined,
          facebookUrl: facebookUrl || undefined,
          instagramUrl: instagramUrl || undefined,
          websiteUrl: websiteUrl || undefined,
          scrcNumber: scrcNumber || undefined,
          teachingAchievements: teachingAchievements || undefined,
          sportsAchievements: sportsAchievements || undefined,
          qualifications: qualifications,
          pricingPlans: JSON.stringify(pricingRows.map(({ id, ...rest }) => rest)),
          packageDetails: packageDetails || undefined,
          ageGroups,
          teachingFocus,
        }),
      });
      
      if (res.ok) {
        toast({ title: "修改申請已提交", description: "管理員審核後將更新你的檔案，通常於 1-2 個工作天內完成。" });
        await refetchCoachStatus();
        navigate("/coach-portal");
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "提交失敗", description: err.error || "請稍後再試。", variant: "destructive" });
      }
    } catch {
      toast({ title: "提交時出錯", variant: "destructive" });
    }
    setSubmitting(false);
  }

  if (loading || isAuthLoading) {
    return (
      <Layout>
        <div className="container px-4 py-8 max-w-4xl mx-auto">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-96" />
        </div>
      </Layout>
    );
  }

  if (!coach) return null;

  return (
    <Layout>
      <div className="container px-4 py-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/coach-portal">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">編輯教練檔案</h1>
            <p className="text-sm text-muted-foreground">{coach.name} · {coach.sportsCategory}</p>
          </div>
        </div>

        {/* Pending edits warning */}
        {coach.pendingEdits && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">修改申請審批中</p>
              <p className="text-sm text-amber-700">
                你有待審批的修改。管理員審核後將自動更新，通常於 1-2 個工作天內完成。
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <Card>
            <CardContent className="p-6 space-y-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                基本資料
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>教練名稱</Label>
                  <Input 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>教練資歷</Label>
                  <Input 
                    value={experienceLevel}
                    onChange={e => setExperienceLevel(e.target.value)}
                    placeholder="例：持牌教練、專業運動員"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>授課地區（可多選）</Label>
                <div className="flex flex-wrap gap-2">
                  {HK_DISTRICTS.map(district => (
                    <button
                      key={district}
                      type="button"
                      onClick={() => toggleDistrict(district)}
                      className={`px-3 py-1.5 rounded-full border text-sm transition-all ${
                        location.includes(district)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-white border-border hover:border-primary/50"
                      }`}
                    >
                      {district}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>適合年齡層</Label>
                <div className="flex flex-wrap gap-2">
                  {["幼童（8歲以下）", "兒童（8至12歲）", "青少年（12-17歲）", "成人（18歲以上）", "長者（60歲以上）"].map(age => (
                    <button
                      key={age}
                      type="button"
                      onClick={() => toggleAgeGroup(age)}
                      className={`px-3 py-1.5 rounded-full border text-sm transition-all ${
                        ageGroups.includes(age)
                          ? "bg-secondary text-secondary-foreground border-secondary"
                          : "bg-white border-border hover:border-secondary/50"
                      }`}
                    >
                      {age}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>教學類型</Label>
                <div className="flex gap-3">
                  {["競賽", "興趣"].map(focus => (
                    <button
                      key={focus}
                      type="button"
                      onClick={() => toggleTeachingFocus(focus)}
                      className={`px-4 py-2 rounded-xl border text-sm transition-all ${
                        teachingFocus.includes(focus)
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-white border-border hover:border-primary/30"
                      }`}
                    >
                      {focus === "競賽" ? "🏆 " : "🎯 "}{focus}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bio */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">個人簡介</h2>
              <Textarea 
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={6}
                placeholder="介紹你的教學理念、專長、經驗..."
              />
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardContent className="p-6 space-y-6">
              <h2 className="text-lg font-semibold">成就與資歷</h2>
              
              <div className="space-y-2">
                <Label>教學成就</Label>
                <Textarea 
                  value={teachingAchievements}
                  onChange={e => setTeachingAchievements(e.target.value)}
                  rows={4}
                  placeholder="例：執教經驗、學員成果..."
                />
              </div>

              <div className="space-y-2">
                <Label>運動成就</Label>
                <Textarea 
                  value={sportsAchievements}
                  onChange={e => setSportsAchievements(e.target.value)}
                  rows={4}
                  placeholder="例：比賽成績、代表隊經歷..."
                />
              </div>

              <div className="space-y-2">
                <Label>專業資歷（JSON 格式）</Label>
                <Textarea 
                  value={qualifications}
                  onChange={e => setQualifications(e.target.value)}
                  rows={3}
                  placeholder='[{"text": "資格名稱"}, {"text": "另一項資格"}]'
                />
              </div>

              <div className="space-y-2">
                <Label>SCRC 編號（性罪行定罪紀錄查核）</Label>
                <Input 
                  value={scrcNumber}
                  onChange={e => setScrcNumber(e.target.value)}
                  placeholder="例：SCRC2024HK123456"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">聯絡方式</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input 
                    value={whatsappNumber}
                    onChange={e => setWhatsappNumber(e.target.value)}
                    placeholder="+852 9123 4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label>網站</Label>
                  <Input 
                    value={websiteUrl}
                    onChange={e => setWebsiteUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Facebook</Label>
                  <Input 
                    value={facebookUrl}
                    onChange={e => setFacebookUrl(e.target.value)}
                    placeholder="https://facebook.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Instagram</Label>
                  <Input 
                    value={instagramUrl}
                    onChange={e => setInstagramUrl(e.target.value)}
                    placeholder="https://instagram.com/..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardContent className="p-6 space-y-6">
              <h2 className="text-lg font-semibold">收費計劃</h2>
              
              <div className="space-y-3">
                {pricingRows.map((row, idx) => (
                  <div key={row.id} className="flex flex-col sm:flex-row gap-2 items-start bg-slate-50 rounded-xl border p-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground w-6 pt-2 shrink-0">
                      {idx + 1}.
                    </div>

                    <div className="flex-1 min-w-[100px]">
                      <p className="text-xs text-muted-foreground mb-1">課堂形式</p>
                      <Select
                        value={row.sessionType}
                        onValueChange={v => updatePricingRow(row.id, { sessionType: v as "單對單" | "小組課堂", minStudents: "", maxStudents: "" })}
                      >
                        <SelectTrigger className="bg-white h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="單對單">一對一</SelectItem>
                          <SelectItem value="小組課堂">小組課堂</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {row.sessionType === "小組課堂" && (
                      <>
                        <div className="flex-1 min-w-[70px]">
                          <p className="text-xs text-muted-foreground mb-1">最少</p>
                          <Input
                            type="number"
                            min={2}
                            className="bg-white h-9"
                            value={row.minStudents}
                            onChange={e => updatePricingRow(row.id, { minStudents: e.target.value })}
                          />
                        </div>
                        <div className="flex-1 min-w-[70px]">
                          <p className="text-xs text-muted-foreground mb-1">最多</p>
                          <Input
                            type="number"
                            min={2}
                            className="bg-white h-9"
                            value={row.maxStudents}
                            onChange={e => updatePricingRow(row.id, { maxStudents: e.target.value })}
                          />
                        </div>
                      </>
                    )}

                    <div className="flex-1 min-w-[90px]">
                      <p className="text-xs text-muted-foreground mb-1">時長</p>
                      <Select
                        value={row.duration || "60分鐘"}
                        onValueChange={v => updatePricingRow(row.id, { duration: v })}
                      >
                        <SelectTrigger className="bg-white h-9">
                          <SelectValue placeholder="選擇時長" />
                        </SelectTrigger>
                        <SelectContent>
                          {["30分鐘", "45分鐘", "60分鐘", "90分鐘", "120分鐘"].map(d => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex-1 min-w-[90px]">
                      <p className="text-xs text-muted-foreground mb-1">收費</p>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                        <Input
                          type="number"
                          min={0}
                          className="pl-6 bg-white h-9"
                          value={row.price}
                          onChange={e => updatePricingRow(row.id, { price: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="flex-1 min-w-[110px]">
                      <p className="text-xs text-muted-foreground mb-1">年齡</p>
                      <Select
                        value={row.ageGroup || "_all"}
                        onValueChange={v => updatePricingRow(row.id, { ageGroup: v === "_all" ? "" : v })}
                      >
                        <SelectTrigger className="bg-white h-9">
                          <SelectValue placeholder="所有年齡" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_all">所有年齡</SelectItem>
                          {AGE_GROUP_PRICING_OPTIONS.map(ag => (
                            <SelectItem key={ag} value={ag}>{ag}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <button
                      type="button"
                      onClick={() => removePricingRow(row.id)}
                      disabled={pricingRows.length === 1}
                      className="mt-5 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={addPricingRow}
              >
                <Plus className="w-4 h-4" /> 新增收費
              </Button>

              <div className="space-y-2">
                <Label>套餐優惠</Label>
                <Textarea 
                  value={packageDetails}
                  onChange={e => setPackageDetails(e.target.value)}
                  rows={2}
                  placeholder="例：10堂88折、兄弟姊妹優惠..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex items-center justify-end gap-4">
            <Link href="/coach-portal">
              <Button type="button" variant="outline" disabled={submitting}>
                取消
              </Button>
            </Link>
            <Button type="submit" disabled={submitting} className="gap-2">
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" />提交中…</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" />提交修改申請</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
