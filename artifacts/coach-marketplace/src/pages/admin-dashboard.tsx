import { Layout } from "@/components/layout";
import { useUser } from "@clerk/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminListPendingCoaches, useAdminApproveCoach, useAdminRejectCoach, useAdminListPendingReviews, useAdminApproveReview, useAdminRejectReview, useAdminListPendingPhotos, useAdminApprovePhoto, useAdminRejectPhoto } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Check, X, ShieldAlert, ShieldCheck, Loader2, Copy, BarChart3, Flag, Users, Search, ToggleLeft, ToggleRight, Star, Pencil, ChevronDown, ChevronUp, Save, Youtube, Clock, Trash2, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getAdminListPendingCoachesQueryKey, getAdminListPendingReviewsQueryKey, getAdminListPendingPhotosQueryKey, getListCoachesQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useAdminStatus } from "@/hooks/use-admin-status";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { getBaseUrl } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-token";

type Analytics = {
  totalCoaches: number; totalReviews: number; pendingReports: number;
  sportsCounts: { sport: string; count: number }[];
  districtCounts: { district: string; count: number }[];
};

type Report = {
  id: number; userId: string; coachId: number; coachName?: string;
  reason: string; description?: string; status: string; adminNote?: string; createdAt: string;
};

export default function AdminDashboard() {
  const { user, isSignedIn, isLoaded } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: adminStatus, isLoading: isAdminLoading } = useAdminStatus();

  const { data: pendingCoaches } = useAdminListPendingCoaches();
  const { data: pendingReviews } = useAdminListPendingReviews();
  const { data: pendingPhotos } = useAdminListPendingPhotos();

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [updatingReport, setUpdatingReport] = useState<number | null>(null);

  type PendingPost = {
    id: number; coachId: number; caption?: string | null; mediaUrls?: string | null;
    youtubeUrl?: string | null; isApproved: boolean; isRejected: boolean;
    rejectionReason?: string | null; createdAt: string; coachName?: string | null; coachSport?: string | null;
  };
  const [pendingPosts, setPendingPosts] = useState<PendingPost[]>([]);
  const [updatingPost, setUpdatingPost] = useState<number | null>(null);
  const [rejectPostReason, setRejectPostReason] = useState<Record<number, string>>({});

  type UserAnalytics = {
    totalUsers: number; onboardedUsers: number; totalWishlists: number;
    topWishlistedCoaches: { coachId: number; coachName?: string; sport?: string; saves: number }[];
    topSports: { label: string; count: number }[];
    topGoals: { label: string; count: number }[];
    topDistricts: { label: string; count: number }[];
  };
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);

  type UserProfileRow = {
    id: number; userId: string; displayName?: string | null;
    goals: string[]; availability: string[]; preferredDistricts: string[]; preferredSports: string[];
    onboardingCompleted: boolean; createdAt: string;
  };
  const [userProfiles, setUserProfiles] = useState<UserProfileRow[]>([]);
  const [profileSearch, setProfileSearch] = useState("");

  type PricingRow = { id: string; sessionType: "單對單" | "小組課堂"; price: string; minStudents: string; maxStudents: string; duration: string };
  type QualEntry = { text: string; proofUrl: string };

  type CoachRow = {
    id: number; name: string; sportsCategory: string; location: string;
    isApproved: boolean; isRejected: boolean; isFeatured: boolean; trialPrice: number; regularPrice: number;
    experienceLevel: string; whatsappNumber?: string | null;
    profileImageUrl?: string | null; createdAt: string;
    youtubeUrl?: string | null; youtubePending?: string | null;
    pendingEdits?: string | null;
    pricingPlans?: string | null; qualifications?: string | null; packageDetails?: string | null;
  };
  const [allCoaches, setAllCoaches] = useState<CoachRow[]>([]);
  const [coachSearch, setCoachSearch] = useState("");
  const [coachFilter, setCoachFilter] = useState<"all" | "active" | "inactive" | "rejected">("all");
  const [togglingCoach, setTogglingCoach] = useState<number | null>(null);
  const [togglingFeatured, setTogglingFeatured] = useState<number | null>(null);
  const [loadingCoaches, setLoadingCoaches] = useState(false);

  type EditDraft = {
    name: string; sportsCategory: string; location: string; bio: string;
    trialPrice: string; regularPrice: string; experienceLevel: string; whatsappNumber: string;
    packageDetails: string;
    pricingRows: PricingRow[];
    qualList: QualEntry[];
  };
  const newPricingRow = (): PricingRow => ({ id: crypto.randomUUID(), sessionType: "單對單", price: "", minStudents: "", maxStudents: "", duration: "" });
  const [expandedEditId, setExpandedEditId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [approvingYoutube, setApprovingYoutube] = useState<number | null>(null);
  const [approvingEdits, setApprovingEdits] = useState<number | null>(null);

  async function handleEditsApprove(coachId: number) {
    setApprovingEdits(coachId);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${getBaseUrl()}/api/admin/coaches/${coachId}/edits/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAllCoaches(prev => prev.map(c => c.id === coachId ? {
          ...c,
          name: data.coach.name ?? c.name,
          sportsCategory: data.coach.sportsCategory ?? c.sportsCategory,
          location: data.coach.location ?? c.location,
          trialPrice: data.coach.trialPrice ?? c.trialPrice,
          regularPrice: data.coach.regularPrice ?? c.regularPrice,
          experienceLevel: data.coach.experienceLevel ?? c.experienceLevel,
          whatsappNumber: data.coach.whatsappNumber ?? c.whatsappNumber,
          pendingEdits: null,
        } : c));
        toast({ title: "✅ 修改申請已批准，檔案已更新" });
      } else {
        toast({ title: "批准失敗", variant: "destructive" });
      }
    } catch { toast({ title: "網絡錯誤", variant: "destructive" }); }
    setApprovingEdits(null);
  }

  async function handleEditsReject(coachId: number) {
    setApprovingEdits(coachId);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${getBaseUrl()}/api/admin/coaches/${coachId}/edits/reject`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAllCoaches(prev => prev.map(c => c.id === coachId ? { ...c, pendingEdits: null } : c));
        toast({ title: "修改申請已拒絕並移除" });
      } else {
        toast({ title: "拒絕失敗", variant: "destructive" });
      }
    } catch { toast({ title: "網絡錯誤", variant: "destructive" }); }
    setApprovingEdits(null);
  }

  async function handleApprovePost(postId: number) {
    setUpdatingPost(postId);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${getBaseUrl()}/api/admin/posts/${postId}/approve`, {
        method: "PUT", headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPendingPosts(prev => prev.filter(p => p.id !== postId));
        toast({ title: "✅ 動向已批准並公開" });
      } else {
        toast({ title: "批准失敗", variant: "destructive" });
      }
    } catch { toast({ title: "網絡錯誤", variant: "destructive" }); }
    setUpdatingPost(null);
  }

  async function handleRejectPost(postId: number) {
    setUpdatingPost(postId);
    try {
      const token = await getAuthToken();
      const reason = rejectPostReason[postId] || "";
      const res = await fetch(`${getBaseUrl()}/api/admin/posts/${postId}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        setPendingPosts(prev => prev.filter(p => p.id !== postId));
        toast({ title: "動向已拒絕" });
      } else {
        toast({ title: "拒絕失敗", variant: "destructive" });
      }
    } catch { toast({ title: "網絡錯誤", variant: "destructive" }); }
    setUpdatingPost(null);
  }

  async function handleYoutubeApprove(coachId: number) {
    setApprovingYoutube(coachId);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${getBaseUrl()}/api/admin/coaches/${coachId}/youtube/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAllCoaches(prev => prev.map(c => c.id === coachId ? { ...c, youtubeUrl: data.youtubeUrl, youtubePending: null } : c));
        toast({ title: "✅ 影片連結已批准並公開" });
      } else {
        toast({ title: "批准失敗", variant: "destructive" });
      }
    } catch { toast({ title: "網絡錯誤", variant: "destructive" }); }
    setApprovingYoutube(null);
  }

  async function handleYoutubeReject(coachId: number) {
    setApprovingYoutube(coachId);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${getBaseUrl()}/api/admin/coaches/${coachId}/youtube/reject`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAllCoaches(prev => prev.map(c => c.id === coachId ? { ...c, youtubePending: null } : c));
        toast({ title: "影片連結已拒絕並移除" });
      } else {
        toast({ title: "拒絕失敗", variant: "destructive" });
      }
    } catch { toast({ title: "網絡錯誤", variant: "destructive" }); }
    setApprovingYoutube(null);
  }

  function openEdit(coach: CoachRow) {
    if (expandedEditId === coach.id) {
      setExpandedEditId(null);
      setEditDraft(null);
      return;
    }
    let pricingRows: PricingRow[] = [];
    try {
      const parsed = coach.pricingPlans ? JSON.parse(coach.pricingPlans) : [];
      pricingRows = Array.isArray(parsed) ? parsed.map((r: Omit<PricingRow, "id">) => ({ ...r, id: crypto.randomUUID() })) : [];
    } catch {}
    if (pricingRows.length === 0) {
      // Fall back to legacy trialPrice / regularPrice fields
      const trial = Number(coach.trialPrice);
      const regular = Number(coach.regularPrice);
      if (trial > 0 && trial !== regular) {
        pricingRows = [
          { id: crypto.randomUUID(), sessionType: "單對單", price: String(trial), minStudents: "", maxStudents: "", duration: "" },
          { id: crypto.randomUUID(), sessionType: "單對單", price: String(regular), minStudents: "", maxStudents: "", duration: "" },
        ];
      } else if (regular > 0) {
        pricingRows = [{ id: crypto.randomUUID(), sessionType: "單對單", price: String(regular), minStudents: "", maxStudents: "", duration: "" }];
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

    setExpandedEditId(coach.id);
    setEditDraft({
      name: coach.name,
      sportsCategory: coach.sportsCategory,
      location: coach.location,
      bio: "",
      trialPrice: String(coach.trialPrice),
      regularPrice: String(coach.regularPrice),
      experienceLevel: coach.experienceLevel,
      whatsappNumber: coach.whatsappNumber || "",
      packageDetails: coach.packageDetails || "",
      pricingRows,
      qualList,
    });
  }

  async function saveEdit(coachId: number) {
    if (!editDraft) return;
    setSavingEdit(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${getBaseUrl()}/api/admin/coaches/${coachId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: editDraft.name,
          sportsCategory: editDraft.sportsCategory,
          location: editDraft.location,
          bio: editDraft.bio || undefined,
          trialPrice: parseFloat(editDraft.trialPrice),
          regularPrice: parseFloat(editDraft.regularPrice),
          experienceLevel: editDraft.experienceLevel,
          whatsappNumber: editDraft.whatsappNumber || undefined,
          packageDetails: editDraft.packageDetails || undefined,
          pricingPlans: JSON.stringify(editDraft.pricingRows.map(({ id: _id, ...r }) => r)),
          qualifications: JSON.stringify(editDraft.qualList.filter(q => q.text.trim())),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAllCoaches(prev => prev.map(c => c.id === coachId ? {
          ...c,
          name: data.coach.name,
          sportsCategory: data.coach.sportsCategory,
          location: data.coach.location,
          trialPrice: data.coach.trialPrice,
          regularPrice: data.coach.regularPrice,
          experienceLevel: data.coach.experienceLevel,
          whatsappNumber: data.coach.whatsappNumber,
        } : c));
        toast({ title: "✅ 教練資料已更新" });
        setExpandedEditId(null);
        setEditDraft(null);
      } else {
        toast({ title: "儲存失敗", description: "請稍後再試", variant: "destructive" });
      }
    } catch {
      toast({ title: "網絡錯誤", variant: "destructive" });
    }
    setSavingEdit(false);
  }

  useEffect(() => {
    if (!adminStatus?.isAdmin) return;
    getAuthToken().then(token => {
      const headers = { Authorization: `Bearer ${token}` };
      fetch(`${getBaseUrl()}/api/admin/analytics`, { headers })
        .then(r => r.json()).then(d => setAnalytics(d)).catch(() => {});
      fetch(`${getBaseUrl()}/api/admin/reports`, { headers })
        .then(r => r.json()).then(d => setReports(d.reports || [])).catch(() => {});
      fetch(`${getBaseUrl()}/api/admin/posts/pending`, { headers })
        .then(r => r.json()).then(d => setPendingPosts(Array.isArray(d) ? d : [])).catch(() => {});
      fetch(`${getBaseUrl()}/api/admin/user-analytics`, { headers })
        .then(r => r.json()).then(d => setUserAnalytics(d)).catch(() => {});
      fetch(`${getBaseUrl()}/api/admin/user-profiles`, { headers })
        .then(r => r.json()).then(d => setUserProfiles(d.profiles || [])).catch(() => {});
    });
  }, [adminStatus?.isAdmin]);

  useEffect(() => {
    if (!adminStatus?.isAdmin) return;
    setLoadingCoaches(true);
    const params = new URLSearchParams();
    if (coachSearch) params.set("search", coachSearch);
    else params.set("status", coachFilter);
    getAuthToken().then(token => {
      fetch(`${getBaseUrl()}/api/admin/coaches/all?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()).then(d => {
        setAllCoaches(d.coaches || []);
        setLoadingCoaches(false);
      }).catch(() => setLoadingCoaches(false));
    });
  }, [adminStatus?.isAdmin, coachSearch, coachFilter]);

  async function toggleCoachStatus(id: number, current: boolean) {
    setTogglingCoach(id);
    const token = await getAuthToken();
    const res = await fetch(`${getBaseUrl()}/api/admin/coaches/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isApproved: !current }),
    });
    if (res.ok) {
      setAllCoaches(prev => prev.map(c => c.id === id ? { ...c, isApproved: !current } : c));
      toast({ title: !current ? "教練已啟用" : "教練已停用" });
    }
    setTogglingCoach(null);
  }

  async function toggleCoachFeatured(id: number, current: boolean) {
    setTogglingFeatured(id);
    const token = await getAuthToken();
    const res = await fetch(`${getBaseUrl()}/api/admin/coaches/${id}/featured`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isFeatured: !current }),
    });
    if (res.ok) {
      setAllCoaches(prev => prev.map(c => c.id === id ? { ...c, isFeatured: !current } : c));
      toast({ title: !current ? "⭐ 已設為精選教練" : "已取消精選" });
    }
    setTogglingFeatured(null);
  }

  async function updateReport(id: number, status: string) {
    setUpdatingReport(id);
    const token = await getAuthToken();
    const res = await fetch(`${getBaseUrl()}/api/admin/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    setReports(prev => prev.map(r => r.id === id ? { ...r, ...data.report } : r));
    setUpdatingReport(null);
    toast({ title: status === "resolved" ? "舉報已處理" : "舉報已關閉" });
  }

  const reasonLabels: Record<string, string> = {
    fake_profile: "虛假資料", inappropriate: "不當行為", scam: "疑似詐騙",
    wrong_info: "資料錯誤", other: "其他"
  };

  const approveCoach = useAdminApproveCoach();
  const rejectCoach = useAdminRejectCoach();
  const approveReview = useAdminApproveReview();
  const rejectReview = useAdminRejectReview();
  const approvePhoto = useAdminApprovePhoto();
  const rejectPhoto = useAdminRejectPhoto();

  const handleApproveCoach = (id: number) => {
    approveCoach.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "教練已批准" });
        queryClient.invalidateQueries({ queryKey: getAdminListPendingCoachesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListCoachesQueryKey() });
      }
    });
  };

  const handleRejectCoach = (id: number) => {
    rejectCoach.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "教練已拒絕" });
        queryClient.invalidateQueries({ queryKey: getAdminListPendingCoachesQueryKey() });
      }
    });
  };

  const handleApproveReview = (id: number) => {
    approveReview.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "評價已批准" });
        queryClient.invalidateQueries({ queryKey: getAdminListPendingReviewsQueryKey() });
      }
    });
  };

  const handleRejectReview = (id: number) => {
    rejectReview.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "評價已拒絕" });
        queryClient.invalidateQueries({ queryKey: getAdminListPendingReviewsQueryKey() });
      }
    });
  };

  const handleApprovePhoto = (id: number) => {
    approvePhoto.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "相片已批准" });
        queryClient.invalidateQueries({ queryKey: getAdminListPendingPhotosQueryKey() });
      }
    });
  };

  const handleRejectPhoto = (id: number) => {
    rejectPhoto.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "相片已拒絕" });
        queryClient.invalidateQueries({ queryKey: getAdminListPendingPhotosQueryKey() });
      }
    });
  };

  const copyUserId = () => {
    if (adminStatus?.userId) {
      navigator.clipboard.writeText(adminStatus.userId);
      toast({ title: "用戶 ID 已複製" });
    }
  };

  if (!isLoaded || isAdminLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!isSignedIn) {
    return (
      <Layout>
        <div className="container px-4 md:px-6 py-20 flex-1">
          <div className="max-w-md mx-auto text-center bg-white dark:bg-card rounded-2xl border shadow-sm p-12">
            <ShieldAlert className="w-14 h-14 text-muted-foreground mx-auto mb-6" />
            <h2 className="text-2xl font-bold font-display mb-3">需要登入</h2>
            <p className="text-muted-foreground mb-6">你必須先登入才能存取管理後台。</p>
            <Link href="/sign-in">
              <Button className="w-full">前往登入</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (!adminStatus?.isAdmin) {
    return (
      <Layout>
        <div className="container px-4 md:px-6 py-20 flex-1">
          <div className="max-w-md mx-auto text-center bg-white dark:bg-card rounded-2xl border shadow-sm p-12">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold font-display mb-3">存取被拒絕</h2>
            <p className="text-muted-foreground mb-8">
              你的帳戶沒有管理員權限。如需存取權限，請將你的用戶 ID 提供給平台管理員。
            </p>
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border p-4 mb-4 text-left">
              <p className="text-xs text-muted-foreground mb-1 font-medium">你的用戶 ID</p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-foreground flex-1 break-all">
                  {adminStatus?.userId ?? "—"}
                </code>
                <Button variant="ghost" size="sm" className="shrink-0 h-7 w-7 p-0" onClick={copyUserId}>
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              登入為：{user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container px-4 md:px-6 py-12 flex-1">
        <div className="mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-display">管理後台</h1>
            <p className="text-muted-foreground text-sm">管理待審核的平台內容。</p>
          </div>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="pending" className="flex gap-2">
              待審核
              {(() => {
                const total = (pendingCoaches?.length ?? 0) + (pendingReviews?.length ?? 0) + (pendingPhotos?.length ?? 0);
                return total > 0 ? <Badge variant="destructive" className="px-1.5 min-w-[20px] h-5">{total}</Badge> : null;
              })()}
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex gap-2">
              <Users className="w-3.5 h-3.5" /> 教練管理
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex gap-2">
              <Flag className="w-3.5 h-3.5" /> 舉報管理
              {reports.filter(r => r.status === "pending").length > 0 && (
                <Badge variant="destructive" className="px-1.5 min-w-[20px] h-5">{reports.filter(r => r.status === "pending").length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex gap-2">
              <BarChart3 className="w-3.5 h-3.5" /> 平台數據
            </TabsTrigger>
            <TabsTrigger value="users" className="flex gap-2">
              <Users className="w-3.5 h-3.5" /> 用戶數據
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Tabs defaultValue="coaches" className="w-full">
              <TabsList className="mb-4 h-auto gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <TabsTrigger value="coaches" className="flex gap-2 rounded-md">
                  待審核教練
                  {pendingCoaches && pendingCoaches.length > 0 && (
                    <Badge variant="destructive" className="px-1.5 min-w-[20px] h-5">{pendingCoaches.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="reviews" className="flex gap-2 rounded-md">
                  待審核評價
                  {pendingReviews && pendingReviews.length > 0 && (
                    <Badge variant="destructive" className="px-1.5 min-w-[20px] h-5">{pendingReviews.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="photos" className="flex gap-2 rounded-md">
                  待審核相片
                  {pendingPhotos && pendingPhotos.length > 0 && (
                    <Badge variant="destructive" className="px-1.5 min-w-[20px] h-5">{pendingPhotos.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="posts" className="flex gap-2 rounded-md">
                  待審核動向
                  {pendingPosts.length > 0 && (
                    <Badge variant="destructive" className="px-1.5 min-w-[20px] h-5">{pendingPosts.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="coaches" className="space-y-4 mt-0">
                {pendingCoaches?.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-card rounded-xl border text-muted-foreground">
                    暫無待審核的教練。
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {pendingCoaches?.map(coach => (
                      <div key={coach.id} className="bg-white dark:bg-card p-6 rounded-xl border shadow-sm flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex gap-4 flex-1 min-w-0">
                          <div className="shrink-0">
                            {coach.profileImageUrl ? (
                              <img
                                src={coach.profileImageUrl}
                                alt={coach.name}
                                className="w-20 h-20 rounded-xl object-cover border shadow-sm"
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-xl bg-slate-100 border flex items-center justify-center text-slate-400 text-2xl font-bold">
                                {coach.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-bold text-lg">{coach.name}</h3>
                              <Badge variant="secondary">{coach.sportsCategory}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{coach.bio}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-muted-foreground">
                              <span>📍 {coach.location}</span>
                              <span>體驗堂：${coach.trialPrice}</span>
                              <span>正課：${coach.regularPrice}</span>
                              <span>{coach.experienceLevel}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleApproveCoach(coach.id)} disabled={approveCoach.isPending}>
                            <Check className="w-4 h-4 mr-1" /> 批准
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleRejectCoach(coach.id)} disabled={rejectCoach.isPending}>
                            <X className="w-4 h-4 mr-1" /> 拒絕
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="space-y-4 mt-0">
                {pendingReviews?.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-card rounded-xl border text-muted-foreground">
                    暫無待審核的評價。
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {pendingReviews?.map(review => (
                      <div key={review.id} className="bg-white dark:bg-card p-6 rounded-xl border shadow-sm flex flex-col md:flex-row justify-between gap-6">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold">{review.userName || "匿名用戶"}</span>
                            <Badge variant="secondary">評分：{review.rating}/5</Badge>
                            <span className="text-xs text-muted-foreground">教練 ID：{review.coachId}</span>
                          </div>
                          <p className="text-sm">{review.comment}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleApproveReview(review.id)} disabled={approveReview.isPending}>
                            <Check className="w-4 h-4 mr-1" /> 批准
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleRejectReview(review.id)} disabled={rejectReview.isPending}>
                            <X className="w-4 h-4 mr-1" /> 拒絕
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="photos" className="space-y-4 mt-0">
                {pendingPhotos?.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-card rounded-xl border text-muted-foreground">
                    暫無待審核的相片。
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {pendingPhotos?.map(photo => (
                      <div key={photo.id} className="bg-white dark:bg-card rounded-xl border shadow-sm overflow-hidden flex flex-col">
                        <div className="aspect-square bg-slate-100">
                          <img src={photo.imageUrl} alt="Pending approval" className="w-full h-full object-cover" />
                        </div>
                        <div className="p-4 flex justify-between gap-2 bg-slate-50 border-t">
                          <Button variant="outline" size="sm" className="flex-1 text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleApprovePhoto(photo.id)} disabled={approvePhoto.isPending}>
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleRejectPhoto(photo.id)} disabled={rejectPhoto.isPending}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="posts" className="space-y-4 mt-0">
                {pendingPosts.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-card rounded-xl border text-muted-foreground">
                    暫無待審核的動向。
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {pendingPosts.map(post => {
                      const images: string[] = (() => { try { return post.mediaUrls ? JSON.parse(post.mediaUrls) : []; } catch { return []; } })();
                      return (
                        <div key={post.id} className="bg-white dark:bg-card rounded-xl border shadow-sm overflow-hidden">
                          <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between gap-3">
                            <div>
                              <span className="font-semibold text-sm">{post.coachName || `教練 #${post.coachId}`}</span>
                              {post.coachSport && <span className="ml-2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{post.coachSport}</span>}
                            </div>
                            <span className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleDateString("zh-HK")}</span>
                          </div>
                          {images.length > 0 && (
                            <div className={`grid gap-1 ${images.length === 1 ? "grid-cols-1" : images.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                              {images.map((src, i) => (
                                <div key={i} className={`overflow-hidden bg-slate-100 ${images.length === 1 ? "aspect-[16/9]" : "aspect-square"}`}>
                                  <img src={src} alt={`動向圖片 ${i + 1}`} className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="p-5 space-y-4">
                            {post.caption && (
                              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{post.caption}</p>
                            )}
                            <div className="space-y-2">
                              <input
                                type="text"
                                placeholder="拒絕原因（選填）"
                                value={rejectPostReason[post.id] ?? ""}
                                onChange={e => setRejectPostReason(prev => ({ ...prev, [post.id]: e.target.value }))}
                                className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                              />
                              <div className="flex gap-3">
                                <Button
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                  size="sm"
                                  onClick={() => handleApprovePost(post.id)}
                                  disabled={updatingPost === post.id}
                                >
                                  {updatingPost === post.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" /> 批准公開</>}
                                </Button>
                                <Button
                                  variant="outline"
                                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                                  size="sm"
                                  onClick={() => handleRejectPost(post.id)}
                                  disabled={updatingPost === post.id}
                                >
                                  <X className="w-4 h-4 mr-1" /> 拒絕
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="manage">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="搜尋教練姓名、運動或地區…"
                    value={coachSearch}
                    onChange={e => setCoachSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-white dark:bg-card focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["all", "active", "inactive", "rejected"] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => { setCoachFilter(f); setCoachSearch(""); }}
                      className={`px-3 py-2 text-sm rounded-lg border font-medium transition-all ${coachFilter === f && !coachSearch ? "bg-primary text-primary-foreground border-primary" : "bg-white border-border hover:border-primary/50"}`}
                    >
                      {f === "all" ? "全部" : f === "active" ? "已啟用" : f === "inactive" ? "待審核" : "已拒絕"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                共 {allCoaches.length} 位教練 · 已啟用 {allCoaches.filter(c => c.isApproved).length} · 待審核 {allCoaches.filter(c => !c.isApproved && !c.isRejected).length} · 已拒絕 {allCoaches.filter(c => c.isRejected).length}
              </div>

              {loadingCoaches ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : allCoaches.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-card rounded-xl border text-muted-foreground">沒有符合的教練。</div>
              ) : (
                <div className="grid gap-3">
                  {allCoaches.map(coach => (
                    <div key={coach.id} className="bg-white dark:bg-card rounded-xl border shadow-sm overflow-hidden">
                      {/* Row */}
                      <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex gap-3 flex-1 min-w-0">
                          {/* Thumbnail */}
                          <div className="shrink-0">
                            {coach.profileImageUrl ? (
                              <img src={coach.profileImageUrl} alt={coach.name} className="w-12 h-12 rounded-lg object-cover border" />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-slate-100 border flex items-center justify-center text-slate-400 font-bold text-sm">
                                {coach.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="font-semibold">{coach.name}</span>
                              <Badge variant="secondary" className="text-xs">{coach.sportsCategory}</Badge>
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  coach.isApproved
                                    ? "bg-green-100 text-green-700 border-green-200"
                                    : coach.isRejected
                                    ? "bg-red-100 text-red-700 border-red-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}
                              >
                                {coach.isApproved ? "已啟用" : coach.isRejected ? "已拒絕" : "待審核"}
                              </Badge>
                              {coach.isFeatured && (
                                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-600 border-amber-200">
                                  <Star className="w-3 h-3 mr-1 fill-amber-400 text-amber-400" /> 精選
                                </Badge>
                              )}
                              {coach.youtubePending && (
                                <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">
                                  <Youtube className="w-3 h-3 mr-1" /> 影片待審
                                </Badge>
                              )}
                              {coach.pendingEdits && (
                                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                  <Pencil className="w-3 h-3 mr-1" /> 修改待審
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                              <span>📍 {coach.location}</span>
                              <span>體驗堂 ${coach.trialPrice} · 正課 ${coach.regularPrice}</span>
                              <span>{coach.experienceLevel}</span>
                              {coach.whatsappNumber && (
                                <a href={`https://wa.me/${coach.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                                  WA: {coach.whatsappNumber}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => toggleCoachFeatured(coach.id, coach.isFeatured)}
                            disabled={togglingFeatured === coach.id}
                            title={coach.isFeatured ? "取消精選" : "設為精選"}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                              coach.isFeatured
                                ? "border-amber-300 text-amber-600 bg-amber-50 hover:bg-amber-100"
                                : "border-slate-200 text-slate-500 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50"
                            }`}
                          >
                            {togglingFeatured === coach.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Star className={`w-4 h-4 ${coach.isFeatured ? "fill-amber-400 text-amber-400" : ""}`} />
                            )}
                            <span className="hidden sm:inline">{coach.isFeatured ? "精選中" : "設精選"}</span>
                          </button>
                          <button
                            onClick={() => toggleCoachStatus(coach.id, coach.isApproved)}
                            disabled={togglingCoach === coach.id}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                              coach.isApproved
                                ? "border-red-200 text-red-600 hover:bg-red-50"
                                : "border-green-200 text-green-600 hover:bg-green-50"
                            }`}
                          >
                            {togglingCoach === coach.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : coach.isApproved ? (
                              <><ToggleRight className="w-4 h-4" /><span className="hidden sm:inline">停用</span></>
                            ) : (
                              <><ToggleLeft className="w-4 h-4" /><span className="hidden sm:inline">啟用</span></>
                            )}
                          </button>
                          <a
                            href={`/coaches/${coach.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 rounded-lg text-sm border border-border hover:bg-muted transition-colors text-muted-foreground"
                          >
                            查看
                          </a>
                          <button
                            onClick={() => openEdit(coach)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                              expandedEditId === coach.id
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-slate-200 text-slate-500 hover:border-primary/50 hover:text-primary hover:bg-primary/5"
                            }`}
                          >
                            <Pencil className="w-4 h-4" />
                            <span className="hidden sm:inline">編輯</span>
                            {expandedEditId === coach.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      {/* Inline edit panel */}
                      {expandedEditId === coach.id && editDraft && (
                        <div className="border-t bg-slate-50 dark:bg-muted/30 px-5 py-5">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">編輯教練資料</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">姓名</label>
                              <input
                                value={editDraft.name}
                                onChange={e => setEditDraft(d => d ? { ...d, name: e.target.value } : d)}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">運動類別</label>
                              <input
                                value={editDraft.sportsCategory}
                                onChange={e => setEditDraft(d => d ? { ...d, sportsCategory: e.target.value } : d)}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">地點</label>
                              <input
                                value={editDraft.location}
                                onChange={e => setEditDraft(d => d ? { ...d, location: e.target.value } : d)}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">WhatsApp 號碼</label>
                              <input
                                value={editDraft.whatsappNumber}
                                onChange={e => setEditDraft(d => d ? { ...d, whatsappNumber: e.target.value } : d)}
                                placeholder="例：85298765432"
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">經驗級別</label>
                              <select
                                value={editDraft.experienceLevel}
                                onChange={e => setEditDraft(d => d ? { ...d, experienceLevel: e.target.value } : d)}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                              >
                                <option value="beginner">初級</option>
                                <option value="intermediate">中級</option>
                                <option value="advanced">高級</option>
                                <option value="professional">專業</option>
                              </select>
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-xs font-medium text-slate-600 mb-1">簡介（選填，留空則不更新）</label>
                              <textarea
                                value={editDraft.bio}
                                onChange={e => setEditDraft(d => d ? { ...d, bio: e.target.value } : d)}
                                rows={3}
                                placeholder="留空則保留原有簡介"
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                              />
                            </div>
                          </div>

                          {/* Pricing Plans Editor */}
                          <div className="mt-5">
                            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">收費表</p>
                            <div className="space-y-2">
                              {editDraft.pricingRows.map((row, idx) => (
                                <div key={row.id} className="grid grid-cols-12 gap-1.5 items-center bg-white border border-slate-200 rounded-lg p-2">
                                  <div className="col-span-12 sm:col-span-3">
                                    <select
                                      value={row.sessionType}
                                      onChange={e => setEditDraft(d => d ? { ...d, pricingRows: d.pricingRows.map(r => r.id === row.id ? { ...r, sessionType: e.target.value as PricingRow["sessionType"] } : r) } : d)}
                                      className="w-full px-2 py-1.5 text-xs rounded border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-primary/40"
                                    >
                                      <option value="單對單">👤 單對單</option>
                                      <option value="小組課堂">👥 小組課堂</option>
                                    </select>
                                  </div>
                                  <div className="col-span-6 sm:col-span-2">
                                    <input
                                      type="number"
                                      placeholder="價錢 $"
                                      value={row.price}
                                      onChange={e => setEditDraft(d => d ? { ...d, pricingRows: d.pricingRows.map(r => r.id === row.id ? { ...r, price: e.target.value } : r) } : d)}
                                      className="w-full px-2 py-1.5 text-xs rounded border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-primary/40"
                                    />
                                  </div>
                                  <div className="col-span-6 sm:col-span-2">
                                    <input
                                      placeholder="時長（分鐘）"
                                      value={row.duration}
                                      onChange={e => setEditDraft(d => d ? { ...d, pricingRows: d.pricingRows.map(r => r.id === row.id ? { ...r, duration: e.target.value } : r) } : d)}
                                      className="w-full px-2 py-1.5 text-xs rounded border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-primary/40"
                                    />
                                  </div>
                                  {row.sessionType === "小組課堂" && (
                                    <>
                                      <div className="col-span-5 sm:col-span-2">
                                        <input
                                          type="number"
                                          placeholder="最少人數"
                                          value={row.minStudents}
                                          onChange={e => setEditDraft(d => d ? { ...d, pricingRows: d.pricingRows.map(r => r.id === row.id ? { ...r, minStudents: e.target.value } : r) } : d)}
                                          className="w-full px-2 py-1.5 text-xs rounded border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-primary/40"
                                        />
                                      </div>
                                      <div className="col-span-5 sm:col-span-2">
                                        <input
                                          type="number"
                                          placeholder="最多人數"
                                          value={row.maxStudents}
                                          onChange={e => setEditDraft(d => d ? { ...d, pricingRows: d.pricingRows.map(r => r.id === row.id ? { ...r, maxStudents: e.target.value } : r) } : d)}
                                          className="w-full px-2 py-1.5 text-xs rounded border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-primary/40"
                                        />
                                      </div>
                                    </>
                                  )}
                                  <div className="col-span-2 sm:col-span-1 flex justify-end">
                                    <button
                                      onClick={() => setEditDraft(d => d && d.pricingRows.length > 1 ? { ...d, pricingRows: d.pricingRows.filter(r => r.id !== row.id) } : d)}
                                      className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                      title="刪除此行"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <div className="col-span-12 text-[10px] text-slate-400 pl-0.5">
                                    第 {idx + 1} 行
                                  </div>
                                </div>
                              ))}
                            </div>
                            <button
                              onClick={() => setEditDraft(d => d ? { ...d, pricingRows: [...d.pricingRows, newPricingRow()] } : d)}
                              className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
                            >
                              <Plus className="w-3 h-3" /> 新增收費行
                            </button>
                          </div>

                          {/* Other Pricing Details */}
                          <div className="mt-3">
                            <label className="block text-xs font-medium text-slate-600 mb-1">其他收費模式（選填）</label>
                            <textarea
                              value={editDraft.packageDetails}
                              onChange={e => setEditDraft(d => d ? { ...d, packageDetails: e.target.value } : d)}
                              rows={2}
                              placeholder="例：月費套餐、課程包等"
                              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                            />
                          </div>

                          {/* Qualifications Editor */}
                          <div className="mt-4">
                            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">專業資歷</p>
                            <div className="space-y-2">
                              {editDraft.qualList.map((q, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <span className="text-xs text-slate-400 w-5 shrink-0">{idx + 1}.</span>
                                  <input
                                    value={q.text}
                                    onChange={e => setEditDraft(d => d ? { ...d, qualList: d.qualList.map((qi, i) => i === idx ? { ...qi, text: e.target.value } : qi) } : d)}
                                    placeholder="例：香港游泳教練資格証 (HKSI)"
                                    className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                  />
                                  <button
                                    onClick={() => setEditDraft(d => d && d.qualList.length > 1 ? { ...d, qualList: d.qualList.filter((_, i) => i !== idx) } : d)}
                                    className="p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                    title="刪除"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                            <button
                              onClick={() => setEditDraft(d => d ? { ...d, qualList: [...d.qualList, { text: "", proofUrl: "" }] } : d)}
                              className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
                            >
                              <Plus className="w-3 h-3" /> 新增資歷
                            </button>
                          </div>
                          <div className="flex gap-2 mt-4 justify-end">
                            <button
                              onClick={() => { setExpandedEditId(null); setEditDraft(null); }}
                              className="px-4 py-2 rounded-lg text-sm border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                              取消
                            </button>
                            <button
                              onClick={() => saveEdit(coach.id)}
                              disabled={savingEdit}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
                            >
                              {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                              儲存更改
                            </button>
                          </div>

                          {/* YouTube approval section */}
                          {coach.youtubePending && (
                            <div className="mt-4 pt-4 border-t">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                <Youtube className="w-3.5 h-3.5 text-red-500" /> 待審核影片連結
                              </p>
                              <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                                <Clock className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <a
                                    href={coach.youtubePending}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline truncate block"
                                  >
                                    {coach.youtubePending}
                                  </a>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                  <button
                                    onClick={() => handleYoutubeApprove(coach.id)}
                                    disabled={approvingYoutube === coach.id}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
                                  >
                                    {approvingYoutube === coach.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                    批准
                                  </button>
                                  <button
                                    onClick={() => handleYoutubeReject(coach.id)}
                                    disabled={approvingYoutube === coach.id}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
                                  >
                                    {approvingYoutube === coach.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                                    拒絕
                                  </button>
                                </div>
                              </div>
                              {coach.youtubeUrl && (
                                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                  <Check className="w-3 h-3 text-green-500" /> 批准後將取代現有已公開影片連結。
                                </p>
                              )}
                            </div>
                          )}

                          {coach.youtubeUrl && !coach.youtubePending && (
                            <div className="mt-4 pt-4 border-t">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                <Youtube className="w-3.5 h-3.5 text-green-500" /> 已公開影片
                              </p>
                              <a
                                href={coach.youtubeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline truncate block"
                              >
                                {coach.youtubeUrl}
                              </a>
                            </div>
                          )}

                          {/* Pending edits review */}
                          {coach.pendingEdits && (() => {
                            let edits: Record<string, unknown> = {};
                            try { edits = JSON.parse(coach.pendingEdits); } catch { return null; }
                            const fieldLabels: Record<string, string> = {
                              name: "姓名", sportsCategory: "運動類別", location: "地點",
                              bio: "個人簡介", trialPrice: "體驗堂價格", regularPrice: "正課價格",
                              packageDetails: "套餐詳情", ageGroups: "適合年齡組別",
                              experienceLevel: "經驗級別", whatsappNumber: "WhatsApp",
                              profileImageUrl: "頭像",
                            };
                            return (
                              <div className="mt-4 pt-4 border-t">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                  <Pencil className="w-3.5 h-3.5 text-orange-500" /> 待審核修改申請
                                </p>
                                <div className="space-y-2 mb-3">
                                  {Object.entries(edits).map(([key, val]) => (
                                    <div key={key} className="flex gap-2 text-xs">
                                      <span className="font-medium text-slate-600 w-24 shrink-0">{fieldLabels[key] || key}</span>
                                      <span className="text-slate-800 break-all">
                                        {Array.isArray(val) ? (val as string[]).join("、") : String(val)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEditsApprove(coach.id)}
                                    disabled={approvingEdits === coach.id}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
                                  >
                                    {approvingEdits === coach.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                    批准修改
                                  </button>
                                  <button
                                    onClick={() => handleEditsReject(coach.id)}
                                    disabled={approvingEdits === coach.id}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
                                  >
                                    {approvingEdits === coach.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                                    拒絕修改
                                  </button>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            {reports.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-card rounded-xl border text-muted-foreground">
                暫無舉報紀錄。
              </div>
            ) : (
              <div className="grid gap-4">
                {reports.map(report => (
                  <div key={report.id} className="bg-white dark:bg-card p-5 rounded-xl border shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge variant={report.status === "pending" ? "destructive" : report.status === "resolved" ? "default" : "secondary"} className="text-xs">
                            {report.status === "pending" ? "待處理" : report.status === "resolved" ? "已處理" : "已關閉"}
                          </Badge>
                          <Badge variant="outline" className="text-xs">{reasonLabels[report.reason] || report.reason}</Badge>
                          {report.coachName && <span className="text-sm font-medium">教練：{report.coachName}</span>}
                          <span className="text-xs text-muted-foreground">{new Date(report.createdAt).toLocaleDateString("zh-HK")}</span>
                        </div>
                        {report.description && (
                          <p className="text-sm text-muted-foreground mb-2">{report.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">用戶 ID：{report.userId}</p>
                      </div>
                      {report.status === "pending" && (
                        <div className="flex gap-2 shrink-0">
                          <Button
                            variant="outline" size="sm"
                            className="text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => updateReport(report.id, "resolved")}
                            disabled={updatingReport === report.id}
                          >
                            <Check className="w-3.5 h-3.5 mr-1" /> 已處理
                          </Button>
                          <Button
                            variant="outline" size="sm"
                            className="text-slate-500 border-slate-200 hover:bg-slate-50"
                            onClick={() => updateReport(report.id, "dismissed")}
                            disabled={updatingReport === report.id}
                          >
                            <X className="w-3.5 h-3.5 mr-1" /> 關閉
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users">
            {!userAnalytics ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (() => {
              const goalLabels: Record<string, string> = {
                weight_loss: "💪 減重塑形", muscle_gain: "🏋️ 增肌強壯", competition: "🏆 備戰比賽",
                fitness: "❤️ 提升健康", skill: "🎯 學習技術", fun: "🎉 興趣娛樂", rehab: "🌿 康復調理",
              };
              const availLabels: Record<string, string> = {
                weekday_morning: "平日早上", weekday_afternoon: "平日下午", weekday_evening: "平日晚上",
                weekend_morning: "週末早上", weekend_afternoon: "週末下午", weekend_evening: "週末晚上",
              };
              const onboardingRate = userAnalytics.totalUsers > 0
                ? Math.round((userAnalytics.onboardedUsers / userAnalytics.totalUsers) * 100)
                : 0;
              const filteredProfiles = profileSearch
                ? userProfiles.filter(p =>
                    p.userId.toLowerCase().includes(profileSearch.toLowerCase()) ||
                    p.preferredSports.some(s => s.includes(profileSearch)) ||
                    p.preferredDistricts.some(d => d.includes(profileSearch))
                  )
                : userProfiles;
              return (
                <div className="space-y-8">

                  {/* ── Summary stats ── */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "已登記用戶", value: userAnalytics.totalUsers, color: "bg-blue-50 border-blue-200 text-blue-800" },
                      { label: "完成問卷用戶", value: userAnalytics.onboardedUsers, color: "bg-green-50 border-green-200 text-green-800" },
                      { label: "問卷完成率", value: `${onboardingRate}%`, color: "bg-purple-50 border-purple-200 text-purple-800" },
                      { label: "收藏教練次數", value: userAnalytics.totalWishlists, color: "bg-amber-50 border-amber-200 text-amber-800" },
                    ].map(stat => (
                      <div key={stat.label} className={`rounded-xl border p-5 ${stat.color}`}>
                        <p className="text-3xl font-bold mb-1">{stat.value}</p>
                        <p className="text-sm font-medium opacity-80">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* ── Aggregate charts ── */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-card rounded-xl border p-5 shadow-sm">
                      <h3 className="font-bold mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> 用戶偏好運動（Top 8）</h3>
                      {userAnalytics.topSports.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">暫無數據</p>
                      ) : (
                        <div className="space-y-2">
                          {userAnalytics.topSports.slice(0, 8).map(item => (
                            <div key={item.label} className="flex items-center gap-3">
                              <span className="text-sm text-muted-foreground w-20 shrink-0 truncate">{item.label}</span>
                              <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${Math.max(8, (item.count / userAnalytics.topSports[0].count) * 100)}%` }} />
                              </div>
                              <span className="text-sm font-semibold w-8 text-right">{item.count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="bg-white dark:bg-card rounded-xl border p-5 shadow-sm">
                      <h3 className="font-bold mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-green-600" /> 用戶訓練目標</h3>
                      {userAnalytics.topGoals.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">暫無數據</p>
                      ) : (
                        <div className="space-y-2">
                          {userAnalytics.topGoals.map(item => (
                            <div key={item.label} className="flex items-center gap-3">
                              <span className="text-sm text-muted-foreground w-24 shrink-0 truncate">{goalLabels[item.label] || item.label}</span>
                              <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-green-400 rounded-full" style={{ width: `${Math.max(8, (item.count / userAnalytics.topGoals[0].count) * 100)}%` }} />
                              </div>
                              <span className="text-sm font-semibold w-8 text-right">{item.count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="bg-white dark:bg-card rounded-xl border p-5 shadow-sm">
                      <h3 className="font-bold mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-amber-500" /> 用戶偏好地區（Top 8）</h3>
                      {userAnalytics.topDistricts.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">暫無數據</p>
                      ) : (
                        <div className="space-y-2">
                          {userAnalytics.topDistricts.slice(0, 8).map(item => (
                            <div key={item.label} className="flex items-center gap-3">
                              <span className="text-sm text-muted-foreground w-24 shrink-0 truncate">{item.label}</span>
                              <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.max(8, (item.count / userAnalytics.topDistricts[0].count) * 100)}%` }} />
                              </div>
                              <span className="text-sm font-semibold w-8 text-right">{item.count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="bg-white dark:bg-card rounded-xl border p-5 shadow-sm">
                      <h3 className="font-bold mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-red-500" /> 最多人收藏教練</h3>
                      {userAnalytics.topWishlistedCoaches.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">暫無數據</p>
                      ) : (
                        <div className="space-y-2">
                          {userAnalytics.topWishlistedCoaches.map(item => (
                            <div key={item.coachId} className="flex items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{item.coachName || `Coach #${item.coachId}`}</p>
                                <p className="text-xs text-muted-foreground">{item.sport}</p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <div className="h-5 bg-red-100 rounded-full overflow-hidden" style={{ width: `${Math.max(20, (item.saves / userAnalytics.topWishlistedCoaches[0].saves) * 80)}px` }}>
                                  <div className="h-full bg-red-400 rounded-full w-full" />
                                </div>
                                <span className="text-sm font-semibold">{item.saves}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Individual survey responses ── */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" /> 個人問卷回應
                        <Badge variant="secondary">{userProfiles.length}</Badge>
                      </h3>
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="搜尋用戶ID / 運動 / 地區…"
                          value={profileSearch}
                          onChange={e => setProfileSearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-white dark:bg-card focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                    </div>

                    {filteredProfiles.length === 0 ? (
                      <div className="text-center py-10 bg-white dark:bg-card rounded-xl border text-muted-foreground text-sm">
                        {userProfiles.length === 0 ? "暫未有用戶完成問卷。" : "沒有符合的結果。"}
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {filteredProfiles.map(profile => (
                          <div key={profile.id} className="bg-white dark:bg-card rounded-xl border shadow-sm p-5">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono text-muted-foreground">
                                {profile.userId.slice(0, 20)}…
                              </code>
                              <Badge variant={profile.onboardingCompleted ? "default" : "outline"}
                                className={`text-xs ${profile.onboardingCompleted ? "bg-green-100 text-green-700 border-green-200" : "bg-slate-100 text-slate-500"}`}>
                                {profile.onboardingCompleted ? "已完成問卷" : "未完成"}
                              </Badge>
                              <span className="text-xs text-muted-foreground ml-auto">
                                {new Date(profile.createdAt).toLocaleDateString("zh-HK")}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                              {profile.preferredSports?.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">偏好運動</p>
                                  <div className="flex flex-wrap gap-1">
                                    {profile.preferredSports.map(s => (
                                      <span key={s} className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">{s}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {profile.goals?.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">訓練目標</p>
                                  <div className="flex flex-wrap gap-1">
                                    {profile.goals.map(g => (
                                      <span key={g} className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">{goalLabels[g] || g}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {profile.availability?.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">可用時間</p>
                                  <div className="flex flex-wrap gap-1">
                                    {profile.availability.map(a => (
                                      <span key={a} className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">{availLabels[a] || a}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {profile.preferredDistricts?.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">偏好地區</p>
                                  <div className="flex flex-wrap gap-1">
                                    {profile.preferredDistricts.map(d => (
                                      <span key={d} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">{d}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              );
            })()}
          </TabsContent>

          <TabsContent value="analytics">
            {!analytics ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: "已認證教練", value: analytics.totalCoaches, color: "bg-blue-50 border-blue-200 text-blue-800" },
                    { label: "已審核評價", value: analytics.totalReviews, color: "bg-green-50 border-green-200 text-green-800" },
                    { label: "待處理舉報", value: analytics.pendingReports, color: "bg-red-50 border-red-200 text-red-800" },
                  ].map(stat => (
                    <div key={stat.label} className={`rounded-xl border p-5 ${stat.color}`}>
                      <p className="text-3xl font-bold mb-1">{stat.value}</p>
                      <p className="text-sm font-medium opacity-80">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-card rounded-xl border p-5 shadow-sm">
                    <h3 className="font-bold mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> 各運動教練數</h3>
                    <div className="space-y-2">
                      {analytics.sportsCounts.slice(0, 10).map(item => (
                        <div key={item.sport} className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground w-24 shrink-0 truncate">{item.sport}</span>
                          <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${Math.max(8, (item.count / analytics.sportsCounts[0].count) * 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold w-8 text-right">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-card rounded-xl border p-5 shadow-sm">
                    <h3 className="font-bold mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> 各地區教練數</h3>
                    <div className="space-y-2">
                      {analytics.districtCounts.slice(0, 10).map(item => (
                        <div key={item.district} className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground w-24 shrink-0 truncate">{item.district}</span>
                          <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full"
                              style={{ width: `${Math.max(8, (item.count / analytics.districtCounts[0].count) * 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold w-8 text-right">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
