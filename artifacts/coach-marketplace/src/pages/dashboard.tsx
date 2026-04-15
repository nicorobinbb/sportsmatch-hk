import { Layout } from "@/components/layout";
import { useUser, useAuth } from "@clerk/react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Star, MapPin, MessageCircle, Zap, Trophy, Target, Pencil, ExternalLink, Clock, CheckCircle2, AlertCircle, Loader2, Plus, Trash2, User } from "lucide-react";
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
  onboardingCompleted: boolean;
};

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
  const { user } = useUser();
  const { isLoaded, isSignedIn } = useAuth();
  const { toast } = useToast();
  const [savedCoaches, setSavedCoaches] = useState<SavedCoach[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recommendedCoaches, setRecommendedCoaches] = useState<SavedCoach[]>([]);
  const [loading, setLoading] = useState(true);

  const [myCoaches, setMyCoaches] = useState<MyCoach[]>([]);
  const [loadingMyCoaches, setLoadingMyCoaches] = useState(true);

  const [editingCoach, setEditingCoach] = useState<MyCoach | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [pendingEditsOverride, setPendingEditsOverride] = useState<Record<number, string | null>>({});

  // Profile edit state
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [profileEditFirstName, setProfileEditFirstName] = useState("");
  const [profileEditLastName, setProfileEditLastName] = useState("");
  const [profileEditSports, setProfileEditSports] = useState<string[]>([]);
  const [profileEditGoals, setProfileEditGoals] = useState<string[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      setLoadingMyCoaches(false);
      return;
    }
    async function load() {
      const token = await getAuthToken();
      if (!token) {
        setLoading(false);
        setLoadingMyCoaches(false);
        return;
      }
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
        setMyCoaches(coachData.coaches || []);

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
      setLoadingMyCoaches(false);
    }
    load();
  }, [isLoaded, isSignedIn]);

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
    setProfileEditFirstName(profile?.firstName || "");
    setProfileEditLastName(profile?.lastName || "");
    setProfileEditSports(profile?.preferredSports || []);
    setProfileEditGoals(profile?.goals || []);
    setProfileEditOpen(true);
  }

  async function saveProfileEdit() {
    setSavingProfile(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${getBaseUrl()}/api/user/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          firstName: profileEditFirstName.trim() || null,
          lastName: profileEditLastName.trim() || null,
          preferredSports: profileEditSports,
          goals: profileEditGoals,
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

  function toggleProfileGoal(goal: string) {
    setProfileEditGoals(prev => prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]);
  }

  function getEffectivePending(coach: MyCoach): string | null {
    if (pendingEditsOverride[coach.id] !== undefined) return pendingEditsOverride[coach.id];
    return coach.pendingEdits ?? null;
  }

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

        {/* My Coach Profiles section */}
        {loadingMyCoaches ? (
          <Skeleton className="h-36 rounded-2xl mb-8" />
        ) : myCoaches.length > 0 ? (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">我的教練檔案</h2>
                <Badge variant="secondary">{myCoaches.length}</Badge>
              </div>
              <Link href="/coach/register">
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Plus className="w-4 h-4" /> 新增運動項目
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myCoaches.map(coach => {
                const pending = getEffectivePending(coach);
                return (
                  <Card key={coach.id} className="overflow-hidden border-primary/20 shadow-sm">
                    <div className="bg-primary/5 px-4 py-2 border-b flex items-center justify-between gap-2">
                      <Badge variant="secondary" className="text-xs font-medium">{coach.sportsCategory}</Badge>
                      <div className="flex items-center gap-1.5">
                        {coach.isApproved ? (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> 已批准
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                            <Clock className="w-3 h-3 mr-1" /> 待審核
                          </Badge>
                        )}
                        {pending && (
                          <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                            <AlertCircle className="w-3 h-3 mr-1" /> 修改待審
                          </Badge>
                        )}
                        {coach.isFeatured && (
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-600 border-amber-200">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12 flex-shrink-0 border-2 border-primary/10">
                          <AvatarImage src={coach.profileImageUrl || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">{coach.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{coach.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {coach.location}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(() => {
                              let rows: Array<{ sessionType: string; price: string; duration: string; minStudents?: string; maxStudents?: string; ageGroup?: string }> = [];
                              try { rows = coach.pricingPlans ? JSON.parse(coach.pricingPlans) : []; } catch {}
                              if (rows.length > 0) {
                                return rows.slice(0, 3).map((r, i) => {
                                  const ag = r.ageGroup ? r.ageGroup.replace(/（[^）]*）/, "") : null;
                                  return (
                                    <span key={i} className="inline-flex items-center gap-0.5 text-xs bg-primary/8 text-primary px-1.5 py-0.5 rounded-full font-medium">
                                      {r.sessionType === "小組課堂" ? "👥" : "👤"}
                                      ${r.price}{r.duration ? `·${r.duration.replace("分鐘","分")}` : ""}{r.sessionType === "小組課堂" && r.minStudents ? `·${r.minStudents}${r.maxStudents ? `-${r.maxStudents}` : ""}人` : ""}{ag ? ` · ${ag}` : ""}
                                    </span>
                                  );
                                });
                              }
                              return (
                                <span className="text-xs text-muted-foreground">
                                  體驗堂 <span className="font-semibold text-foreground">${coach.trialPrice}</span>
                                  <span className="mx-1">·</span>
                                  正課 <span className="font-semibold text-foreground">${coach.regularPrice}</span>/小時
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      {pending && (
                        <div className="mt-3 p-2.5 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
                          <Clock className="w-3.5 h-3.5 text-orange-500 mt-0.5 shrink-0" />
                          <p className="text-xs text-orange-700">修改申請正等候審核，通常於 1-2 個工作天內完成。</p>
                        </div>
                      )}

                      <div className="flex gap-2 mt-3">
                        <Link href={`/coaches/${coach.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full gap-1 text-xs">
                            <ExternalLink className="w-3 h-3" /> 查看檔案
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          className="flex-1 gap-1 text-xs"
                          onClick={() => openEdit(coach)}
                          disabled={!!pending}
                          title={pending ? "修改申請審核中，請等候完成後再提交" : undefined}
                        >
                          <Pencil className="w-3 h-3" />
                          {pending ? "審核中…" : "編輯"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        ) : !loadingMyCoaches ? (
          <Card className="mb-8 border-dashed border-primary/30 bg-primary/5">
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 text-primary/40 mx-auto mb-3" />
              <p className="font-semibold mb-1">成為運對認證教練</p>
              <p className="text-sm text-muted-foreground mb-4">提交你的教練資料，接觸更多有需要的學員。</p>
              <Link href="/coach/register">
                <Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> 登記成為教練</Button>
              </Link>
            </CardContent>
          </Card>
        ) : null}

        {/* Profile & Preferences Card — always visible */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-primary/5 border-primary/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">個人資料與喜好</span>
              </div>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={openProfileEdit}>
                <Pencil className="w-3 h-3" /> 編輯
              </Button>
            </div>

            {/* Name row */}
            <div className="flex items-center gap-2 mb-3">
              <Avatar className="h-9 w-9 border border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                  {profile?.lastName?.[0] || user?.firstName?.[0] || "用"}
                </AvatarFallback>
              </Avatar>
              <div>
                {(profile?.firstName || profile?.lastName) ? (
                  <p className="font-semibold text-sm">{profile.lastName}{profile.firstName}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">尚未設定姓名</p>
                )}
                <p className="text-xs text-muted-foreground">{user?.emailAddresses?.[0]?.emailAddress}</p>
              </div>
            </div>

            {/* Sports */}
            <div className="mb-2.5">
              <p className="text-xs text-muted-foreground mb-1.5 font-medium">喜愛運動</p>
              {profile?.preferredSports?.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {profile.preferredSports.map(s => (
                    <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>
              ) : (
                <button onClick={openProfileEdit} className="text-xs text-primary underline">＋ 新增喜愛運動</button>
              )}
            </div>

            {/* Goals */}
            {profile?.goals?.length ? (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5 font-medium">訓練目標</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.goals.map(g => (
                    <Badge key={g} className="text-xs bg-primary/10 text-primary border-primary/20">{goalLabels[g] || g}</Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

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
                          {(() => {
                            let rows: Array<{ sessionType: string; price: string; duration: string; minStudents?: string; maxStudents?: string; ageGroup?: string }> = [];
                            try { rows = coach.pricingPlans ? JSON.parse(coach.pricingPlans) : []; } catch {}
                            if (rows.length > 0) {
                              return rows.slice(0, 2).map((r, i) => {
                                const ag = r.ageGroup ? r.ageGroup.replace(/（[^）]*）/, "") : null;
                                return (
                                  <span key={i} className="inline-flex items-center gap-0.5 text-xs bg-primary/8 text-primary px-1.5 py-0.5 rounded-full font-medium">
                                    {r.sessionType === "小組課堂" ? "👥" : "👤"} ${r.price}{r.duration ? `·${r.duration.replace("分鐘","分")}` : ""}{ag ? ` · ${ag}` : ""}
                                  </span>
                                );
                              });
                            }
                            return <span className="text-xs font-semibold text-primary">體驗堂 ${coach.trialPrice}</span>;
                          })()}
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
                        <div className="flex flex-wrap gap-1">
                          {(() => {
                            let rows: Array<{ sessionType: string; price: string; duration: string; minStudents?: string; maxStudents?: string; ageGroup?: string }> = [];
                            try { rows = coach.pricingPlans ? JSON.parse(coach.pricingPlans) : []; } catch {}
                            if (rows.length > 0) {
                              return rows.slice(0, 2).map((r, i) => {
                                const ag = r.ageGroup ? r.ageGroup.replace(/（[^）]*）/, "") : null;
                                return (
                                  <span key={i} className="inline-flex items-center gap-0.5 text-xs bg-primary/8 text-primary px-1.5 py-0.5 rounded-full font-medium">
                                    {r.sessionType === "小組課堂" ? "👥" : "👤"} ${r.price}{r.duration ? `·${r.duration.replace("分鐘","分")}` : ""}{ag ? ` · ${ag}` : ""}
                                  </span>
                                );
                              });
                            }
                            return <span className="text-sm font-bold text-primary">體驗堂 ${coach.trialPrice}</span>;
                          })()}
                        </div>
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

      {/* User Profile & Preferences Edit Dialog */}
      <Dialog open={profileEditOpen} onOpenChange={setProfileEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> 編輯個人資料與喜好
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Name */}
            <div>
              <p className="text-sm font-semibold mb-3">姓名</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pe-lastName">姓氏</Label>
                  <Input id="pe-lastName" placeholder="例：陳" value={profileEditLastName}
                    onChange={e => setProfileEditLastName(e.target.value)} className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pe-firstName">名字</Label>
                  <Input id="pe-firstName" placeholder="例：大文" value={profileEditFirstName}
                    onChange={e => setProfileEditFirstName(e.target.value)} className="h-10" />
                </div>
              </div>
            </div>

            {/* Sports */}
            <div>
              <p className="text-sm font-semibold mb-2">喜愛運動 <span className="text-muted-foreground font-normal text-xs">（可多選）</span></p>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: "游泳", emoji: "🏊" }, { name: "瑜伽", emoji: "🧘" }, { name: "普拉提", emoji: "🤸" },
                  { name: "足球", emoji: "⚽" }, { name: "籃球", emoji: "🏀" }, { name: "網球", emoji: "🎾" },
                  { name: "羽毛球", emoji: "🏸" }, { name: "拳擊", emoji: "🥊" }, { name: "跑步", emoji: "🏃" },
                  { name: "舞蹈", emoji: "💃" }, { name: "高爾夫球", emoji: "⛳" }, { name: "劍擊", emoji: "🤺" },
                  { name: "田徑", emoji: "🏅" }, { name: "乒乓球", emoji: "🏓" }, { name: "跆拳道", emoji: "🥋" },
                  { name: "排球", emoji: "🏐" },
                ].map(sport => {
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

            {/* Goals */}
            <div>
              <p className="text-sm font-semibold mb-2">訓練目標 <span className="text-muted-foreground font-normal text-xs">（可多選）</span></p>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: "weight_loss", emoji: "💪", label: "減重塑形", desc: "健康瘦身、改善體態" },
                  { id: "muscle_gain", emoji: "🏋️", label: "增肌強壯", desc: "增加肌肉量、體能訓練" },
                  { id: "competition", emoji: "🏆", label: "備戰比賽", desc: "學界、業餘或專業賽事" },
                  { id: "fitness", emoji: "❤️", label: "提升健康", desc: "改善體能、心肺功能" },
                  { id: "skill", emoji: "🎯", label: "學習技術", desc: "掌握新技能、提升水平" },
                  { id: "fun", emoji: "🎉", label: "興趣娛樂", desc: "享受運動樂趣" },
                  { id: "rehab", emoji: "🌿", label: "康復調理", desc: "運動傷患復健" },
                ].map(g => {
                  const active = profileEditGoals.includes(g.id);
                  return (
                    <button key={g.id} type="button" onClick={() => toggleProfileGoal(g.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        active ? "bg-primary border-primary shadow-sm" : "bg-white border-border hover:border-primary/40"
                      }`}>
                      <span className="text-lg shrink-0">{g.emoji}</span>
                      <div className="flex-1">
                        <span className={`font-medium text-sm ${active ? "text-primary-foreground" : ""}`}>{g.label}</span>
                        <span className={`text-xs ml-2 ${active ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{g.desc}</span>
                      </div>
                      {active && <CheckCircle2 className="w-4 h-4 text-primary-foreground/80 shrink-0" />}
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
