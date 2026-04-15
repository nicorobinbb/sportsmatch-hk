import { Layout } from "@/components/layout";
import { useUser } from "@clerk/react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Star, MapPin, MessageCircle, Zap, Trophy, Target, Pencil, ExternalLink, Clock, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import { getBaseUrl } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-token";
import { useToast } from "@/hooks/use-toast";

type SavedCoach = {
  id: number; name: string; sportsCategory: string; location: string;
  bio: string; trialPrice: number; regularPrice: number; profileImageUrl?: string | null;
  experienceLevel: string; averageRating?: number | null; reviewCount: number;
  whatsappNumber?: string | null; savedAt?: string;
};

type UserProfile = {
  goals: string[]; availability: string[]; preferredDistricts: string[]; preferredSports: string[];
  onboardingCompleted: boolean;
};

type MyCoach = {
  id: number; name: string; sportsCategory: string; location: string; bio: string;
  trialPrice: number; regularPrice: number; packageDetails?: string | null;
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

const AGE_GROUP_OPTIONS = ["兒童 (6-12)", "青少年 (13-17)", "成人 (18-40)", "中年 (41-60)", "銀髮族 (60+)"];

type EditForm = {
  name: string; sportsCategory: string; location: string; bio: string;
  trialPrice: string; regularPrice: string; packageDetails: string;
  ageGroups: string[]; experienceLevel: string; whatsappNumber: string;
};

export default function Dashboard() {
  const { user } = useUser();
  const { toast } = useToast();
  const [savedCoaches, setSavedCoaches] = useState<SavedCoach[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recommendedCoaches, setRecommendedCoaches] = useState<SavedCoach[]>([]);
  const [loading, setLoading] = useState(true);

  const [myCoach, setMyCoach] = useState<MyCoach | null | "none">(null);
  const [loadingMyCoach, setLoadingMyCoach] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [pendingEditsState, setPendingEditsState] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    async function load() {
      const token = await getAuthToken();
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const [wishRes, profileRes, coachRes] = await Promise.all([
          fetch(`${getBaseUrl()}/api/wishlist`, { headers }),
          fetch(`${getBaseUrl()}/api/user/profile`, { headers }),
          fetch(`${getBaseUrl()}/api/coaches/me`, { headers }),
        ]);
        const wishData = await wishRes.json();
        const profileData = await profileRes.json();
        const coachData = await coachRes.json();
        setSavedCoaches(wishData.coaches || []);
        setProfile(profileData.profile);
        setMyCoach(coachData.coach ?? "none");

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
      setLoadingMyCoach(false);
    }
    load();
  }, []);

  function openEdit() {
    if (!myCoach || myCoach === "none") return;
    setEditForm({
      name: myCoach.name,
      sportsCategory: myCoach.sportsCategory,
      location: myCoach.location,
      bio: myCoach.bio,
      trialPrice: String(myCoach.trialPrice),
      regularPrice: String(myCoach.regularPrice),
      packageDetails: myCoach.packageDetails || "",
      ageGroups: myCoach.ageGroups || [],
      experienceLevel: myCoach.experienceLevel,
      whatsappNumber: myCoach.whatsappNumber || "",
    });
    setEditOpen(true);
  }

  async function handleSubmitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editForm || !myCoach || myCoach === "none") return;
    setSubmittingEdit(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${getBaseUrl()}/api/coaches/${myCoach.id}/edit-request`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: editForm.name,
          sportsCategory: editForm.sportsCategory,
          location: editForm.location,
          bio: editForm.bio,
          trialPrice: parseFloat(editForm.trialPrice),
          regularPrice: parseFloat(editForm.regularPrice),
          packageDetails: editForm.packageDetails || undefined,
          ageGroups: editForm.ageGroups,
          experienceLevel: editForm.experienceLevel,
          whatsappNumber: editForm.whatsappNumber || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPendingEditsState(data.pendingEdits);
        setEditOpen(false);
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

  const effectivePending = pendingEditsState !== undefined ? pendingEditsState : (myCoach && myCoach !== "none" ? myCoach.pendingEdits ?? null : null);

  return (
    <Layout>
      <div className="container px-4 md:px-6 py-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
              {user?.firstName?.[0] || "用"}
            </div>
            <div>
              <h1 className="text-2xl font-bold">你好，{user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "用戶"} 👋</h1>
            </div>
          </div>
        </div>

        {/* My Coach Profile section */}
        {loadingMyCoach ? (
          <Skeleton className="h-36 rounded-2xl mb-8" />
        ) : myCoach && myCoach !== "none" ? (
          <Card className="mb-8 border-primary/20 shadow-sm overflow-hidden">
            <div className="bg-primary/5 px-5 py-3 border-b flex items-center justify-between">
              <span className="font-semibold text-sm text-primary flex items-center gap-2">
                <Trophy className="w-4 h-4" /> 我的教練檔案
              </span>
              <div className="flex items-center gap-2">
                {myCoach.isApproved ? (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> 已批准公開
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                    <Clock className="w-3 h-3 mr-1" /> 待審核中
                  </Badge>
                )}
                {effectivePending && (
                  <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                    <AlertCircle className="w-3 h-3 mr-1" /> 修改待審
                  </Badge>
                )}
              </div>
            </div>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 flex-shrink-0 border-2 border-primary/20">
                  <AvatarImage src={myCoach.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">{myCoach.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h2 className="text-lg font-bold">{myCoach.name}</h2>
                    <Badge variant="secondary" className="text-xs">{myCoach.sportsCategory}</Badge>
                    {myCoach.isFeatured && (
                      <Badge variant="outline" className="text-xs bg-amber-50 text-amber-600 border-amber-200">
                        <Star className="w-3 h-3 mr-1 fill-amber-400 text-amber-400" /> 精選教練
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-1">
                    <MapPin className="w-3.5 h-3.5" /> {myCoach.location}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    體驗堂 <span className="font-semibold text-foreground">${myCoach.trialPrice}</span>
                    <span className="mx-1.5">·</span>
                    正課 <span className="font-semibold text-foreground">${myCoach.regularPrice}</span>/小時
                  </p>

                  {effectivePending && (
                    <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
                      <Clock className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-orange-800">你有一份修改申請正在等候管理員審核</p>
                        <p className="text-xs text-orange-600 mt-0.5">審核完成後你的檔案將會更新，通常於 1-2 個工作天內完成。</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-4 flex-wrap">
                <Link href={`/coaches/${myCoach.id}`}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5" /> 查看個人檔案
                  </Button>
                </Link>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={openEdit}
                  disabled={!!effectivePending}
                  title={effectivePending ? "你有一份修改申請正在審核中，請等候完成後再提交新的修改。" : undefined}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  {effectivePending ? "修改審核中…" : "編輯個人檔案"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {profile && (profile.goals?.length > 0 || profile.preferredSports?.length > 0) && (
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-primary/5 border-primary/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">你的訓練檔案</span>
                <Link href="/onboarding">
                  <span className="ml-auto text-xs text-primary underline cursor-pointer">更新</span>
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.preferredSports?.map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                {profile.goals?.map(g => <Badge key={g} className="text-xs bg-primary/10 text-primary-foreground border-primary/20">{goalLabels[g] || g}</Badge>)}
                {profile.availability?.map(a => <Badge key={a} variant="outline" className="text-xs">{availabilityLabels[a] || a}</Badge>)}
              </div>
            </CardContent>
          </Card>
        )}

        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="h-5 w-5 text-red-500" />
            <h2 className="text-xl font-bold">已儲存教練</h2>
            <Badge variant="secondary">{savedCoaches.length}</Badge>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
            </div>
          ) : savedCoaches.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <Heart className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">你仲未儲存任何教練</p>
              <Link href="/">
                <Button variant="outline" size="sm">瀏覽教練</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {savedCoaches.map(coach => (
                <Card key={coach.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarImage src={coach.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">{coach.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold truncate">{coach.name}</p>
                            <p className="text-xs text-muted-foreground">{coach.sportsCategory} · {coach.location}</p>
                          </div>
                          <button onClick={() => removeFromWishlist(coach.id)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                            <Heart className="h-4 w-4 fill-current" />
                          </button>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          {coach.averageRating && (
                            <span className="flex items-center gap-1 text-xs text-amber-600">
                              <Star className="h-3 w-3 fill-current" /> {coach.averageRating.toFixed(1)}
                            </span>
                          )}
                          <span className="text-xs font-semibold text-primary">體驗堂 ${coach.trialPrice}</span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Link href={`/coaches/${coach.id}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full text-xs">查看檔案</Button>
                          </Link>
                          {coach.whatsappNumber && (
                            <a href={`https://wa.me/${coach.whatsappNumber}`} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white text-xs px-2">
                                <MessageCircle className="h-3 w-3" />
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">為你推介</h2>
            {profile?.preferredSports?.[0] && (
              <Badge className="bg-primary/10 text-primary-foreground border-primary/20 text-xs">{profile.preferredSports[0]}</Badge>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[1,2,3].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {recommendedCoaches.map(coach => (
                <Link key={coach.id} href={`/coaches/${coach.id}`}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group h-full">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={coach.profileImageUrl || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">{coach.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{coach.name}</p>
                          <p className="text-xs text-muted-foreground">{coach.sportsCategory}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-2.5 w-2.5" />{coach.location}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm font-bold text-primary">體驗堂 ${coach.trialPrice}</span>
                        {coach.averageRating && (
                          <span className="flex items-center gap-1 text-xs text-amber-600">
                            <Star className="h-3 w-3 fill-current" /> {coach.averageRating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-6 text-center">
            <Link href="/">
              <Button variant="outline">探索更多教練</Button>
            </Link>
          </div>
        </section>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-primary" /> 編輯個人檔案
            </DialogTitle>
          </DialogHeader>
          <div className="p-1 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 mb-1">
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
                  <label className="block text-sm font-medium mb-1">體驗堂價格（HKD）</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.trialPrice}
                    onChange={e => setEditForm(f => f ? { ...f, trialPrice: e.target.value } : f)}
                    required
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">正課價格（HKD/小時）</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.regularPrice}
                    onChange={e => setEditForm(f => f ? { ...f, regularPrice: e.target.value } : f)}
                    required
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
                <div>
                  <label className="block text-sm font-medium mb-1">套餐詳情（選填）</label>
                  <input
                    value={editForm.packageDetails}
                    onChange={e => setEditForm(f => f ? { ...f, packageDetails: e.target.value } : f)}
                    placeholder="例：10堂優惠套餐"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
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
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>取消</Button>
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
