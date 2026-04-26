import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Star, MapPin, MessageCircle, Zap, Target, Pencil, Clock, CheckCircle2, AlertCircle, Loader2, Trash2, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getBaseUrl } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-token";
import { useToast } from "@/hooks/use-toast";

type SavedCoach = {
  id: number; name: string; sportsCategory: string; location: string;
  bio: string; trialPrice: number; regularPrice: number; profileImageUrl?: string | null;
  pricingPlans?: string | null; experienceLevel: string; averageRating?: number | null;
  reviewCount: number; whatsappNumber?: string | null; savedAt?: string;
};

type UserProfile = {
  firstName?: string | null; lastName?: string | null;
  goals: string[]; availability: string[]; preferredDistricts: string[]; preferredSports: string[];
  preferredAgeGroups: string[];
  onboardingCompleted: boolean;
};

const PROFILE_SPORTS = [
  { name: "游泳", emoji: "🏊" }, { name: "瑜伽", emoji: "🧘" }, { name: "普拉提", emoji: "🤸" },
  { name: "足球", emoji: "⚽" }, { name: "籃球", emoji: "🏀" }, { name: "網球", emoji: "🎾" },
  { name: "羽毛球", emoji: "🏸" }, { name: "拳擊", emoji: "🥊" }, { name: "跑步", emoji: "🏃" },
  { name: "舞蹈", emoji: "💃" }, { name: "高爾夫球", emoji: "⛳" }, { name: "劍擊", emoji: "🤺" },
  { name: "田徑", emoji: "🏅" }, { name: "乒乓球", emoji: "🏓" }, { name: "跆拳道", emoji: "🥋" },
  { name: "排球", emoji: "🏐" },
];

const PROFILE_AGE_GROUPS = [
  { id: "兒童", emoji: "🧒", desc: "12歲以下" },
  { id: "青少年", emoji: "🧑", desc: "12–17歲" },
  { id: "成人", emoji: "👨", desc: "18歲以上" },
  { id: "長者", emoji: "👴", desc: "60歲以上" },
];

const PROFILE_GOALS = [
  { id: "weight_loss", emoji: "💪", label: "減重塑形", desc: "健康瘦身、改善體態" },
  { id: "muscle_gain", emoji: "🏋️", label: "增肌強壯", desc: "增加肌肉量、體能訓練" },
  { id: "competition", emoji: "🏆", label: "備戰比賽", desc: "學界、業餘或專業賽事" },
  { id: "fitness", emoji: "❤️", label: "提升健康", desc: "改善體能、心肺功能" },
  { id: "skill", emoji: "🎯", label: "學習技術", desc: "掌握新技能、提升水平" },
  { id: "fun", emoji: "🎉", label: "興趣娛樂", desc: "享受運動樂趣" },
  { id: "rehab", emoji: "🌿", label: "康復調理", desc: "運動傷患復健" },
];

const PROFILE_DISTRICTS = [
  { name: "中西區", emoji: "🏙️" }, { name: "灣仔", emoji: "🌃" }, { name: "東區", emoji: "🌅" },
  { name: "南區", emoji: "⛵" }, { name: "油尖旺", emoji: "🛍️" }, { name: "深水埗", emoji: "🏘️" },
  { name: "九龍城", emoji: "🏯" }, { name: "黃大仙", emoji: "🛕" }, { name: "觀塘", emoji: "🏭" },
  { name: "葵青", emoji: "🌿" }, { name: "荃灣", emoji: "🌊" }, { name: "屯門", emoji: "⛩️" },
  { name: "元朗", emoji: "🌾" }, { name: "北區", emoji: "🏔️" }, { name: "大埔", emoji: "🌲" },
  { name: "沙田", emoji: "🏇" }, { name: "西貢", emoji: "🐟" }, { name: "離島", emoji: "🏝️" },
];

type PricingRow = { id: string; sessionType: "單對單" | "小組課堂"; price: string; minStudents: string; maxStudents: string; duration: string; ageGroup?: string };
type QualEntry = { text: string; proofUrl: string };
const newPricingRow = (): PricingRow => ({ id: crypto.randomUUID(), sessionType: "單對單", price: "", minStudents: "", maxStudents: "", duration: "", ageGroup: "" });
const AGE_GROUP_PRICING_OPTIONS = ["幼童（8歲以下）", "兒童（8至12歲）", "青少年（12-17歲）", "成人（18歲以上）", "長者（60歲以上）"];

type MyCoach = {
  id: number; name: string; sportsCategory: string; location: string; bio: string;
  trialPrice: number; regularPrice: number; packageDetails?: string | null;
  pricingPlans?: string | null; qualifications?: string | null;
  ageGroups: string[]; experienceLevel: string; isApproved: boolean; isFeatured: boolean;
  profileImageUrl?: string | null; whatsappNumber?: string | null;
  pendingEdits?: string | null; createdAt: string;
};

const goalLabels: Record<string, string> = {
  weight_loss: "💪 減重塑形", muscle_gain: "🏋️ 增肌強壯", competition: "🏆 備戰比賽",
  fitness: "❤️ 提升健康", skill: "🎯 學習技術", fun: "🎉 興趣娛樂", rehab: "🌿 康復調理",
};

const availabilityLabels: Record<string, string> = {
  weekday_morning: "☀️ 平日早上", weekday_afternoon: "🌤 平日下午", weekday_evening: "🌙 平日晚上",
  weekend_morning: "🌅 週末早上", weekend_afternoon: "🏖 週末下午", weekend_evening: "🌆 週末晚上",
};

const AGE_GROUP_OPTIONS = ["幼童（8歲以下）", "兒童（8至12歲）", "青少年（12-17歲）", "成人（18歲以上）", "長者（60歲以上）"];

type EditForm = {
  name: string; sportsCategory: string; location: string; bio: string;
  packageDetails: string; ageGroups: string[]; experienceLevel: string; whatsappNumber: string;
  pricingRows: PricingRow[]; qualList: QualEntry[];
};

export default function Dashboard() {
  const { user } = useAuth();
  const { isLoading: isAuthLoading, isSignedIn } = useAuth();
  const { toast } = useToast();
  const [savedCoaches, setSavedCoaches] = useState<SavedCoach[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recommendedCoaches, setRecommendedCoaches] = useState<SavedCoach[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingCoach, setEditingCoach] = useState<MyCoach | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [pendingEditsOverride, setPendingEditsOverride] = useState<Record<number, string | null>>({});

  // Profile edit state
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [profileEditFullName, setProfileEditFullName] = useState("");
  const [profileEditSports, setProfileEditSports] = useState<string[]>([]);
  const [profileEditAgeGroups, setProfileEditAgeGroups] = useState<string[]>([]);
  const [profileEditDistricts, setProfileEditDistricts] = useState<string[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  
  // Sidebar navigation state
  const [sidebarActive, setSidebarActive] = useState<'profile' | 'saved'>('profile');

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    async function load() {
      const token = await getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const [wishRes, profileRes] = await Promise.all([
          fetch(`${getBaseUrl()}/api/wishlist`, { headers }),
          fetch(`${getBaseUrl()}/api/user/profile`, { headers }),
        ]);
        const wishData = await wishRes.json();
        const profileData = await profileRes.json();
        setSavedCoaches(wishData.coaches || []);
        setProfile(profileData.profile);

        if (profileData.profile?.preferredSports?.length > 0) {
          const sport = profileData.profile.preferredSports[0];
          const recRes = await fetch(`${getBaseUrl()}/api/coaches?sport=${encodeURIComponent(sport)}&limit=6`);
          const recData = await recRes.json();
          setRecommendedCoaches(recData.coaches || []);
        } else {
          const recRes = await fetch(`${getBaseUrl()}/api/coaches?limit=6`);
          const recData = await recRes.json();
          setRecommendedCoaches(recData.coaches || []);
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, [isAuthLoading, isSignedIn]);

  function openEdit(coach: MyCoach) {
    setEditingCoach(coach);

    let pricingRows: PricingRow[] = [];
    try {
      const parsed = coach.pricingPlans ? JSON.parse(coach.pricingPlans) : [];
      pricingRows = Array.isArray(parsed) ? parsed.map((r: Omit<PricingRow, "id">) => ({ ...r, id: crypto.randomUUID() })) : [];
    } catch {}
    if (pricingRows.length === 0) {
      const trial = Number(coach.trialPrice);
      const regular = Number(coach.regularPrice);
      if (trial > 0 && trial !== regular) {
        pricingRows = [
          { id: crypto.randomUUID(), sessionType: "單對單", price: String(trial), minStudents: "", maxStudents: "", duration: "", ageGroup: "" },
          { id: crypto.randomUUID(), sessionType: "單對單", price: String(regular), minStudents: "", maxStudents: "", duration: "", ageGroup: "" },
        ];
      } else if (regular > 0) {
        pricingRows = [{ id: crypto.randomUUID(), sessionType: "單對單", price: String(regular), minStudents: "", maxStudents: "", duration: "", ageGroup: "" }];
      } else {
        pricingRows = [newPricingRow()];
      }
    }

    let qualList: QualEntry[] = [];
    try {
      const parsed = coach.qualifications ? JSON.parse(coach.qualifications) : [];
      qualList = Array.isArray(parsed) ? parsed : [];
    } catch {}
    if (qualList.length === 0) qualList = [{ text: "", proofUrl: "" }];

    setEditForm({
      name: coach.name,
      sportsCategory: coach.sportsCategory,
      location: coach.location,
      bio: coach.bio,
      packageDetails: coach.packageDetails || "",
      ageGroups: coach.ageGroups || [],
      experienceLevel: coach.experienceLevel,
      whatsappNumber: coach.whatsappNumber || "",
      pricingRows,
      qualList,
    });
  }

  async function handleSubmitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editForm || !editingCoach) return;
    setSubmittingEdit(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${getBaseUrl()}/api/coaches/${editingCoach.id}/edit-request`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: editForm.name,
          sportsCategory: editForm.sportsCategory,
          location: editForm.location,
          bio: editForm.bio,
          packageDetails: editForm.packageDetails || undefined,
          ageGroups: editForm.ageGroups,
          experienceLevel: editForm.experienceLevel,
          whatsappNumber: editForm.whatsappNumber || undefined,
          pricingPlans: JSON.stringify(editForm.pricingRows.map(({ id: _id, ...r }) => r)),
          qualifications: JSON.stringify(editForm.qualList.filter(q => q.text.trim())),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPendingEditsOverride(prev => ({ ...prev, [editingCoach.id]: data.pendingEdits }));
        setEditingCoach(null);
        setEditForm(null);
        toast({ title: "修改申請已提交", description: "管理員審核後將更新你的個人檔案，通常於 1-2 個工作天內完成。" });
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "提交失敗", description: err.error || "請稍後再試。", variant: "destructive" });
      }
    } catch {
      toast({ title: "提交時出錯", variant: "destructive" });
    }
    setSubmittingEdit(false);
  }

  function toggleAgeGroup(group: string) {
    if (!editForm) return;
    setEditForm(f => f ? {
      ...f,
      ageGroups: f.ageGroups.includes(group) ? f.ageGroups.filter(g => g !== group) : [...f.ageGroups, group]
    } : f);
  }

  async function removeFromWishlist(coachId: number) {
    const token = await getAuthToken();
    await fetch(`${getBaseUrl()}/api/wishlist/${coachId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setSavedCoaches(prev => prev.filter(c => c.id !== coachId));
  }

  function openProfileEdit() {
    // Combine lastName + firstName into fullName for editing
    const fullName = profile?.lastName && profile?.firstName 
      ? `${profile.lastName}${profile.firstName}`
      : profile?.lastName || profile?.firstName || "";
    setProfileEditFullName(fullName);
    setProfileEditSports(profile?.preferredSports || []);
    setProfileEditAgeGroups(profile?.preferredAgeGroups || []);
    setProfileEditDistricts(profile?.preferredDistricts || []);
    setProfileEditOpen(true);
  }

  async function saveProfileEdit() {
    setSavingProfile(true);
    try {
      // Split full name into lastName and firstName
      // First character is lastName, rest is firstName
      const trimmedName = profileEditFullName.trim();
      let lastName = "";
      let firstName = "";
      if (trimmedName.length === 1) {
        firstName = trimmedName;
      } else if (trimmedName.length > 1) {
        lastName = trimmedName[0];
        firstName = trimmedName.slice(1);
      }
      
      const token = await getAuthToken();
      const res = await fetch(`${getBaseUrl()}/api/user/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          firstName: firstName || null,
          lastName: lastName || null,
          preferredSports: profileEditSports,
          preferredAgeGroups: profileEditAgeGroups,
          preferredDistricts: profileEditDistricts,
          onboardingCompleted: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setProfileEditOpen(false);
        toast({ title: "個人資料已更新 ✓" });
      }
    } catch {
      toast({ title: "更新失敗，請稍後再試", variant: "destructive" });
    }
    setSavingProfile(false);
  }

  function toggleProfileSport(sport: string) {
    setProfileEditSports(prev => prev.includes(sport) ? prev.filter(s => s !== sport) : [...prev, sport]);
  }

  function toggleProfileAgeGroup(ag: string) {
    setProfileEditAgeGroups(prev => prev.includes(ag) ? prev.filter(a => a !== ag) : [...prev, ag]);
  }

  function toggleProfileDistrict(d: string) {
    setProfileEditDistricts(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }

  function getEffectivePending(coach: MyCoach): string | null {
    if (pendingEditsOverride[coach.id] !== undefined) return pendingEditsOverride[coach.id];
    return coach.pendingEdits ?? null;
  }

  return (
    <Layout>
      <div className="container px-4 md:px-6 py-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 左邊 Sidebar (1/3) */}
          <div className="md:col-span-1">
            {/* 個人資料卡片 */}
            <Card className="mb-4">
              <CardContent className="p-6 text-center">
                <Avatar className="h-20 w-20 mx-auto mb-4 border-4 border-primary/10">
                  <AvatarImage 
                    src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture || undefined} 
                    alt={(profile?.firstName || user?.user_metadata?.first_name) || "用戶"}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                    {profile?.lastName?.[0] || (user?.user_metadata?.first_name)?.[0] || "用"}
                  </AvatarFallback>
                </Avatar>
                
                {(profile?.firstName || profile?.lastName) ? (
                  <h2 className="text-lg font-bold mb-1">{profile.lastName}{profile.firstName}</h2>
                ) : (
                  <h2 className="text-lg font-bold text-muted-foreground mb-1">尚未設定姓名</h2>
                )}
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </CardContent>
            </Card>

            {/* 導航選單 */}
            <Card>
              <CardContent className="p-2">
                <nav className="flex flex-col gap-1">
                  <button
                    onClick={() => setSidebarActive('profile')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      sidebarActive === 'profile' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <User className="h-4 w-4" />
                    <span className="font-medium">個人資料及喜好</span>
                  </button>
                  
                  <button
                    onClick={() => setSidebarActive('saved')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      sidebarActive === 'saved' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <Heart className="h-4 w-4" />
                    <span className="font-medium">已儲存教練</span>
                    <Badge variant={sidebarActive === 'saved' ? "secondary" : "outline"} className="ml-auto text-xs">
                      {savedCoaches.length}
                    </Badge>
                  </button>
                  
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* 右邊主內容 (2/3) */}
          <div className="md:col-span-2">

            {/* 個人資料及喜好內容 */}
            {sidebarActive === 'profile' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">個人資料及喜好</h2>
                  <Button variant="outline" size="sm" className="gap-1" onClick={openProfileEdit}>
                    <Pencil className="w-4 h-4" /> 編輯資料
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* 姓名 */}
                  <Card>
                    <CardContent className="p-5">
                      <h3 className="font-semibold mb-3">姓名</h3>
                      {(profile?.firstName || profile?.lastName) ? (
                        <p className="text-lg">{profile.lastName}{profile.firstName}</p>
                      ) : (
                        <p className="text-muted-foreground italic">尚未設定</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* 喜愛運動 */}
                  <Card>
                    <CardContent className="p-5">
                      <h3 className="font-semibold mb-3">喜愛運動</h3>
                      {profile?.preferredSports?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {profile.preferredSports.map(sport => (
                            <Badge key={sport} variant="secondary">{sport}</Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground italic">尚未選擇</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* 訓練對象年齡 */}
                  <Card>
                    <CardContent className="p-5">
                      <h3 className="font-semibold mb-3">訓練對象年齡</h3>
                      {profile?.preferredAgeGroups?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {profile.preferredAgeGroups.map(age => (
                            <Badge key={age} variant="secondary">{age}</Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground italic">尚未選擇</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* 偏好上課地區 */}
                  <Card>
                    <CardContent className="p-5">
                      <h3 className="font-semibold mb-3">偏好上課地區</h3>
                      {profile?.preferredDistricts?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {profile.preferredDistricts.map(district => (
                            <Badge key={district} variant="secondary">{district}</Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground italic">尚未選擇</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
            
            {/* 已儲存教練內容 */}
            {sidebarActive === 'saved' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">已儲存教練</h2>
                  <Link href="/">
                    <Button variant="outline" size="sm">瀏覽更多教練</Button>
                  </Link>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 gap-4">
                    {[1, 2].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
                  </div>
                ) : savedCoaches.length === 0 ? (
                  <Card className="p-12 text-center border-dashed">
                    <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">你仲未儲存任何教練</p>
                    <Link href="/">
                      <Button>瀏覽教練</Button>
                    </Link>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {savedCoaches.map(coach => (
                      <Card key={coach.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <Avatar className="h-14 w-14 flex-shrink-0">
                              <AvatarImage src={coach.profileImageUrl || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">{coach.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-semibold text-lg truncate">{coach.name}</p>
                                  <p className="text-sm text-muted-foreground">{coach.sportsCategory} · {coach.location}</p>
                                </div>
                                <button onClick={() => removeFromWishlist(coach.id)} className="text-red-400 hover:text-red-600 flex-shrink-0 p-1">
                                  <Heart className="h-5 w-5 fill-current" />
                                </button>
                              </div>
                              <div className="flex items-center gap-4 mt-3">
                                {coach.averageRating && (
                                  <span className="flex items-center gap-1 text-sm text-amber-600">
                                    <Star className="h-4 w-4 fill-current" /> {coach.averageRating.toFixed(1)}
                                  </span>
                                )}
                                <span className="text-sm text-muted-foreground">
                                  試堂 ${coach.trialPrice} · 正價 ${coach.regularPrice}/小時
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* User Profile & Preferences Edit Dialog */}
      <Dialog open={profileEditOpen} onOpenChange={setProfileEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> 編輯個人資料與喜好
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* 姓名 */}
            <div>
              <Label htmlFor="pe-fullName" className="text-sm font-semibold mb-2 block">姓名</Label>
              <Input 
                id="pe-fullName" 
                placeholder="例：陳大文" 
                value={profileEditFullName}
                onChange={e => setProfileEditFullName(e.target.value)} 
                className="h-10" 
              />
              <p className="text-xs text-muted-foreground mt-1">請輸入你的全名</p>
            </div>

            {/* Sports */}
            <div>
              <p className="text-sm font-semibold mb-2">喜愛運動 <span className="text-muted-foreground font-normal text-xs">（可多選）</span></p>
              <div className="flex flex-wrap gap-2">
                {PROFILE_SPORTS.map(sport => {
                  const active = profileEditSports.includes(sport.name);
                  return (
                    <button key={sport.name} type="button" onClick={() => toggleProfileSport(sport.name)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                        active ? "bg-primary text-primary-foreground border-primary" : "bg-white border-border hover:border-primary/50"
                      }`}>
                      {sport.emoji} {sport.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Age Groups */}
            <div>
              <p className="text-sm font-semibold mb-2">訓練對象年齡層 <span className="text-muted-foreground font-normal text-xs">（可多選）</span></p>
              <div className="grid grid-cols-2 gap-2">
                {PROFILE_AGE_GROUPS.map(ag => {
                  const active = profileEditAgeGroups.includes(ag.id);
                  return (
                    <button key={ag.id} type="button" onClick={() => toggleProfileAgeGroup(ag.id)}
                      className={`relative flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        active ? "bg-primary border-primary shadow-sm" : "bg-white border-border hover:border-primary/40"
                      }`}>
                      <span className="text-xl shrink-0">{ag.emoji}</span>
                      <div>
                        <div className={`font-semibold text-sm ${active ? "text-primary-foreground" : ""}`}>{ag.id}</div>
                        <div className={`text-xs ${active ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{ag.desc}</div>
                      </div>
                      {active && <CheckCircle2 className="w-4 h-4 text-primary-foreground/80 shrink-0 ml-auto" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Districts */}
            <div>
              <p className="text-sm font-semibold mb-2">偏好上課地區 <span className="text-muted-foreground font-normal text-xs">（可多選）</span></p>
              <div className="grid grid-cols-3 gap-2">
                {PROFILE_DISTRICTS.map(d => {
                  const active = profileEditDistricts.includes(d.name);
                  return (
                    <button key={d.name} type="button" onClick={() => toggleProfileDistrict(d.name)}
                      className={`relative flex items-center justify-center gap-1 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                        active ? "bg-secondary border-secondary text-secondary-foreground shadow-sm" : "bg-white border-border hover:border-secondary"
                      }`}>
                      {active && <CheckCircle2 className="w-3 h-3 text-secondary-foreground/80 mr-1" />}
                      <span>{d.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setProfileEditOpen(false)}>取消</Button>
            <Button onClick={saveProfileEdit} disabled={savingProfile}>
              {savingProfile ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />儲存中…</> : "儲存更改"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Coach Profile Dialog */}
      <Dialog open={!!editingCoach} onOpenChange={open => { if (!open) { setEditingCoach(null); setEditForm(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-primary" />
              編輯教練檔案
              {editingCoach && <Badge variant="secondary" className="ml-1">{editingCoach.sportsCategory}</Badge>}
            </DialogTitle>
          </DialogHeader>
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800">修改提交後需要管理員審核，通常於 1-2 個工作天內完成。審核期間你的現有檔案將繼續公開顯示。</p>
          </div>
          {editForm && (
            <form onSubmit={handleSubmitEdit} className="space-y-4 mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">姓名 / 稱號</label>
                  <input
                    value={editForm.name}
                    onChange={e => setEditForm(f => f ? { ...f, name: e.target.value } : f)}
                    required
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">運動類別</label>
                  <input
                    value={editForm.sportsCategory}
                    onChange={e => setEditForm(f => f ? { ...f, sportsCategory: e.target.value } : f)}
                    required
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">主要上課地點</label>
                  <input
                    value={editForm.location}
                    onChange={e => setEditForm(f => f ? { ...f, location: e.target.value } : f)}
                    required
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">WhatsApp 號碼</label>
                  <input
                    value={editForm.whatsappNumber}
                    onChange={e => setEditForm(f => f ? { ...f, whatsappNumber: e.target.value } : f)}
                    placeholder="例：85298765432"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">經驗級別</label>
                  <select
                    value={editForm.experienceLevel}
                    onChange={e => setEditForm(f => f ? { ...f, experienceLevel: e.target.value } : f)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="beginner">初級</option>
                    <option value="intermediate">中級</option>
                    <option value="advanced">高級</option>
                    <option value="professional">專業</option>
                  </select>
                </div>
              </div>

              {/* Pricing Table Editor */}
              <div>
                <label className="block text-sm font-semibold mb-2">收費表</label>
                <div className="space-y-2">
                  {editForm.pricingRows.map((row, idx) => (
                    <div key={row.id} className="rounded-lg border border-input bg-muted/30 p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-5 shrink-0">{idx + 1}.</span>
                        <select
                          value={row.sessionType}
                          onChange={e => setEditForm(f => f ? { ...f, pricingRows: f.pricingRows.map(r => r.id === row.id ? { ...r, sessionType: e.target.value as PricingRow["sessionType"] } : r) } : f)}
                          className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          <option value="單對單">👤 單對單</option>
                          <option value="小組課堂">👥 小組課堂</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => setEditForm(f => f && f.pricingRows.length > 1 ? { ...f, pricingRows: f.pricingRows.filter(r => r.id !== row.id) } : f)}
                          className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pl-7">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">價錢（HKD）</label>
                          <input
                            type="number"
                            placeholder="例：500"
                            value={row.price}
                            onChange={e => setEditForm(f => f ? { ...f, pricingRows: f.pricingRows.map(r => r.id === row.id ? { ...r, price: e.target.value } : r) } : f)}
                            className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">時長（分鐘）</label>
                          <input
                            placeholder="例：60"
                            value={row.duration}
                            onChange={e => setEditForm(f => f ? { ...f, pricingRows: f.pricingRows.map(r => r.id === row.id ? { ...r, duration: e.target.value } : r) } : f)}
                            className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                        </div>
                        {row.sessionType === "小組課堂" && (
                          <>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">最少人數</label>
                              <input
                                type="number"
                                placeholder="例：2"
                                value={row.minStudents}
                                onChange={e => setEditForm(f => f ? { ...f, pricingRows: f.pricingRows.map(r => r.id === row.id ? { ...r, minStudents: e.target.value } : r) } : f)}
                                className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">最多人數</label>
                              <input
                                type="number"
                                placeholder="例：6"
                                value={row.maxStudents}
                                onChange={e => setEditForm(f => f ? { ...f, pricingRows: f.pricingRows.map(r => r.id === row.id ? { ...r, maxStudents: e.target.value } : r) } : f)}
                                className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                              />
                            </div>
                          </>
                        )}
                        <div className="col-span-2">
                          <label className="text-xs text-muted-foreground mb-1 block">適合年齡組別（選填）</label>
                          <select
                            value={row.ageGroup ?? ""}
                            onChange={e => setEditForm(f => f ? { ...f, pricingRows: f.pricingRows.map(r => r.id === row.id ? { ...r, ageGroup: e.target.value } : r) } : f)}
                            className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          >
                            <option value="">所有年齡</option>
                            {AGE_GROUP_PRICING_OPTIONS.map(ag => <option key={ag} value={ag}>{ag}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setEditForm(f => f ? { ...f, pricingRows: [...f.pricingRows, newPricingRow()] } : f)}
                  className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> 新增收費行
                </button>
              </div>

              {/* Other Pricing */}
              <div>
                <label className="block text-sm font-medium mb-1">其他收費模式（選填）</label>
                <input
                  value={editForm.packageDetails}
                  onChange={e => setEditForm(f => f ? { ...f, packageDetails: e.target.value } : f)}
                  placeholder="例：月費套餐、課程包等"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Qualifications Editor */}
              <div>
                <label className="block text-sm font-semibold mb-2">專業資歷</label>
                <div className="space-y-2">
                  {editForm.qualList.map((q, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-5 shrink-0">{idx + 1}.</span>
                      <input
                        value={q.text}
                        onChange={e => setEditForm(f => f ? { ...f, qualList: f.qualList.map((qi, i) => i === idx ? { ...qi, text: e.target.value } : qi) } : f)}
                        placeholder="例：香港游泳教練資格証 (HKSI)"
                        className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <button
                        type="button"
                        onClick={() => setEditForm(f => f && f.qualList.length > 1 ? { ...f, qualList: f.qualList.filter((_, i) => i !== idx) } : f)}
                        className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setEditForm(f => f ? { ...f, qualList: [...f.qualList, { text: "", proofUrl: "" }] } : f)}
                  className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> 新增資歷
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">適合年齡組別</label>
                <div className="flex flex-wrap gap-2">
                  {AGE_GROUP_OPTIONS.map(group => (
                    <button
                      key={group}
                      type="button"
                      onClick={() => toggleAgeGroup(group)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        editForm.ageGroups.includes(group)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {group}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">個人簡介</label>
                <Textarea
                  value={editForm.bio}
                  onChange={e => setEditForm(f => f ? { ...f, bio: e.target.value } : f)}
                  required
                  rows={5}
                  placeholder="介紹你的教學風格、資歷及專長…"
                  className="resize-none"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setEditingCoach(null); setEditForm(null); }}>取消</Button>
                <Button type="submit" disabled={submittingEdit}>
                  {submittingEdit ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />提交中…</> : "提交修改申請"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
