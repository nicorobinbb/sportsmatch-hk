import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldAlert, ShieldCheck, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { getBaseUrl } from "@/lib/api";
import { useMemo, useState } from "react";

interface AdminStatus {
  isAdmin: boolean;
  userId: string;
}

type TabKey = "reports" | "allCoaches" | "reviews";
type ReviewStatusFilter = "all" | "unreviewed" | "kept" | "removed";

type PendingCoach = {
  id: number;
  name: string;
  sportsCategory: string;
  location: string;
  createdAt: string;
};

type PendingReview = {
  id: number;
  coachId?: number;
  userName?: string | null;
  rating: number;
  comment: string;
  isRemoved?: boolean;
  removedReason?: string | null;
  removedAt?: string | null;
  removedBy?: string | null;
  createdAt: string;
};

type PendingPhoto = {
  id: number;
  coachId?: number;
  imageUrl: string;
  createdAt: string;
};

type PendingPost = {
  id: number;
  coachId: number;
  coachName?: string | null;
  caption?: string | null;
  mediaUrls?: string | null;
  youtubeUrl?: string | null;
  createdAt: string;
};

type ReportItem = {
  id: number;
  coachName?: string | null;
  reason: string;
  description?: string | null;
  status: string;
  createdAt?: string;
};

type CoachStatusFilter = "all" | "active" | "inactive" | "rejected";

type CoachListItem = {
  id: number;
  name: string;
  sportsCategory: string;
  location: string;
  isApproved: boolean;
  isRejected: boolean;
  isFeatured: boolean;
  isProfessionalAthleteVerified?: boolean;
  isLicensedCoachVerified?: boolean;
  experienceLevel?: string | null;
  whatsappNumber?: string | null;
  bio?: string | null;
  packageDetails?: string | null;
  pricingPlans?: string | null;
  qualifications?: string | null;
  youtubePending?: string | null;
  createdAt: string;
};

type QualificationItem = { text?: string; proofUrl?: string; status?: "pending" | "approved" | "denied" };
type PricingPlanItem = {
  sessionType?: string;
  price?: string | number;
  duration?: string;
  minStudents?: string | number;
  maxStudents?: string | number;
  ageGroup?: string;
};

export default function AdminDashboard() {
  const { user, session, isSignedIn, isLoading } = useAuth();
  const hasAccessToken = !!session?.access_token;
  const [activeTab, setActiveTab] = useState<TabKey>("allCoaches");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [coachSearchInput, setCoachSearchInput] = useState("");
  const [coachSearch, setCoachSearch] = useState("");
  const [coachStatusFilter, setCoachStatusFilter] = useState<CoachStatusFilter>("all");
  const [reviewRemoveReasonById, setReviewRemoveReasonById] = useState<Record<number, string>>({});
  const [reviewStatusFilter, setReviewStatusFilter] = useState<ReviewStatusFilter>("all");
  
  const { data: adminStatus, isLoading: isAdminLoading, error } = useQuery<AdminStatus>({
    queryKey: ["admin-status"],
    queryFn: async () => {
      const token = session?.access_token;
      if (!token) {
        throw new Error("未取得登入憑證，請重新登入");
      }
      const res = await fetch(`${getBaseUrl()}/api/admin/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`權限檢查失敗 (${res.status}): ${text}`);
      }
      return res.json();
    },
    enabled: isSignedIn && hasAccessToken,
  });

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${session?.access_token ?? ""}` }),
    [session?.access_token],
  );

  const { data: pendingCoaches, refetch: refetchCoaches, isLoading: isLoadingCoaches } = useQuery<PendingCoach[]>({
    queryKey: ["admin-pending-coaches"],
    queryFn: async () => {
      const res = await fetch(`${getBaseUrl()}/api/admin/coaches/pending`, { headers: authHeaders });
      if (!res.ok) throw new Error(`載入待審教練失敗 (${res.status})`);
      return res.json();
    },
    enabled: !!adminStatus?.isAdmin,
  });

  const { data: pendingReviews, refetch: refetchReviews, isLoading: isLoadingReviews } = useQuery<PendingReview[]>({
    queryKey: ["admin-reviews-all"],
    queryFn: async () => {
      const res = await fetch(`${getBaseUrl()}/api/admin/reviews/all`, { headers: authHeaders });
      if (!res.ok) throw new Error(`載入評價失敗 (${res.status})`);
      return res.json();
    },
    enabled: !!adminStatus?.isAdmin,
  });

  const filteredReviews = useMemo(() => {
    const all = pendingReviews ?? [];
    const isRemovedReview = (r: PendingReview) =>
      !!r.isRemoved || r.comment.toLowerCase().startsWith("removed by admin due to");
    const isKeptReview = (r: PendingReview) => r.removedReason === "reviewed_keep";
    if (reviewStatusFilter === "all") return all;
    if (reviewStatusFilter === "removed") return all.filter(isRemovedReview);
    if (reviewStatusFilter === "kept") return all.filter(isKeptReview);
    return all.filter((r) => !isRemovedReview(r) && !isKeptReview(r));
  }, [pendingReviews, reviewStatusFilter]);

  const { data: pendingPhotos, refetch: refetchPhotos, isLoading: isLoadingPhotos } = useQuery<PendingPhoto[]>({
    queryKey: ["admin-pending-photos"],
    queryFn: async () => {
      const res = await fetch(`${getBaseUrl()}/api/admin/photos/pending`, { headers: authHeaders });
      if (!res.ok) throw new Error(`載入待審相片失敗 (${res.status})`);
      return res.json();
    },
    enabled: !!adminStatus?.isAdmin,
  });

  const { data: pendingPosts, refetch: refetchPendingPosts, isLoading: isLoadingPendingPosts } = useQuery<PendingPost[]>({
    queryKey: ["admin-pending-posts"],
    queryFn: async () => {
      const res = await fetch(`${getBaseUrl()}/api/admin/posts/pending`, { headers: authHeaders });
      if (!res.ok) throw new Error(`載入待審貼文失敗 (${res.status})`);
      return res.json();
    },
    enabled: !!adminStatus?.isAdmin,
  });

  const { data: reports, refetch: refetchReports, isLoading: isLoadingReports } = useQuery<{ reports: ReportItem[] }>({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const res = await fetch(`${getBaseUrl()}/api/admin/reports`, { headers: authHeaders });
      if (!res.ok) throw new Error(`載入舉報失敗 (${res.status})`);
      return res.json();
    },
    enabled: !!adminStatus?.isAdmin,
  });

  const { data: allCoachesData, refetch: refetchAllCoaches, isLoading: isLoadingAllCoaches } = useQuery<{ coaches: CoachListItem[] }>({
    queryKey: ["admin-all-coaches", coachSearch, coachStatusFilter],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (coachSearch.trim()) qs.set("search", coachSearch.trim());
      qs.set("status", coachStatusFilter);
      const res = await fetch(`${getBaseUrl()}/api/admin/coaches/all?${qs.toString()}`, { headers: authHeaders });
      if (!res.ok) throw new Error(`載入教練資料庫失敗 (${res.status})`);
      return res.json();
    },
    enabled: !!adminStatus?.isAdmin,
  });

  function parseJsonArray<T>(raw: string | null | undefined): T[] {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }

  const updateQualificationStatus = async (
    coach: CoachListItem,
    qualificationIndex: number,
    nextStatus: "approved" | "denied",
  ) => {
    const current = parseJsonArray<QualificationItem>(coach.qualifications).map((q) => ({
      ...q,
      status: q.status ?? "pending",
    }));
    if (!current[qualificationIndex]) return;
    current[qualificationIndex] = {
      ...current[qualificationIndex],
      status: nextStatus,
    };

    await runAction(
      `coach-qualification-${coach.id}-${qualificationIndex}-${nextStatus}`,
      () =>
        fetch(`${getBaseUrl()}/api/admin/coaches/${coach.id}`, {
          method: "PATCH",
          headers: { ...authHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({ qualifications: JSON.stringify(current) }),
        }),
      async () => {
        await refetchAllCoaches();
      },
    );
  };

  const updateCoachCategoryVerification = async (
    coach: CoachListItem,
    field: "isProfessionalAthleteVerified" | "isLicensedCoachVerified",
    nextValue: boolean,
  ) => {
    await runAction(
      `coach-category-${coach.id}-${field}-${nextValue ? "on" : "off"}`,
      () =>
        fetch(`${getBaseUrl()}/api/admin/coaches/${coach.id}`, {
          method: "PATCH",
          headers: { ...authHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: nextValue }),
        }),
      async () => {
        await refetchAllCoaches();
      },
    );
  };

  async function runAction(actionKey: string, fn: () => Promise<Response>, onSuccess: () => Promise<void>) {
    setBusyAction(actionKey);
    setMessage("");
    try {
      const res = await fn();
      if (!res.ok) {
        const text = await res.text();
        setMessage(`操作失敗：${text}`);
        return;
      }
      await onSuccess();
      setMessage("操作成功");
    } catch (e) {
      setMessage(`操作失敗：${e instanceof Error ? e.message : "未知錯誤"}`);
    } finally {
      setBusyAction(null);
    }
  }

  // Avoid indefinite spinner when auth loader flag is stale but session already exists.
  if (isLoading && !hasAccessToken && !isSignedIn) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh] flex-col gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span>載入中 (useAuth)...</span>
        </div>
      </Layout>
    );
  }

  if (!isSignedIn) {
    return (
      <Layout>
        <div className="container px-4 md:px-6 py-20 flex-1">
          <div className="max-w-md mx-auto text-center bg-white rounded-2xl border shadow-sm p-12">
            <ShieldAlert className="w-14 h-14 text-muted-foreground mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-3">需要登入</h2>
            <Link href="/sign-in">
              <Button className="w-full">前往登入</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (isAdminLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh] flex-col gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span>檢查權限中...</span>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container px-4 md:px-6 py-20 flex-1">
          <div className="max-w-md mx-auto text-center bg-white rounded-2xl border shadow-sm p-12">
            <ShieldAlert className="w-14 h-14 text-destructive mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-3">檢查權限失敗</h2>
            <p className="text-muted-foreground">{error.message}</p>
            <p className="text-xs mt-4">User: {user?.email}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!adminStatus?.isAdmin) {
    return (
      <Layout>
        <div className="container px-4 md:px-6 py-20 flex-1">
          <div className="max-w-md mx-auto text-center bg-white rounded-2xl border shadow-sm p-12">
            <ShieldAlert className="w-14 h-14 text-destructive mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-3">存取被拒絕</h2>
            <p className="text-muted-foreground mb-4">你的帳戶沒有管理員權限。</p>
            <p className="text-xs">User ID: {adminStatus?.userId || user?.id}</p>
            <p className="text-xs">Email: {user?.email}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container px-4 md:px-6 py-12 flex-1">
        <div className="mb-8 flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">管理後台</h1>
        </div>
        <p className="mb-1">歡迎回來，{user?.email}！</p>
        <p className="text-sm text-muted-foreground mb-6">Admin User ID: {adminStatus.userId}</p>

        <div className="flex flex-wrap gap-2 mb-6">
          <Button variant={activeTab === "allCoaches" ? "default" : "outline"} onClick={() => setActiveTab("allCoaches")}>全部教練</Button>
          <Button variant={activeTab === "reviews" ? "default" : "outline"} onClick={() => setActiveTab("reviews")}>評價管理</Button>
          <Button variant={activeTab === "reports" ? "default" : "outline"} onClick={() => setActiveTab("reports")}>舉報管理</Button>
        </div>

        {message ? <p className="mb-4 text-sm text-primary">{message}</p> : null}

        {activeTab === "reports" && (
          <div className="space-y-3">
            {isLoadingReports ? <p>載入中...</p> : null}
            {reports?.reports?.length ? reports.reports.map((report) => (
              <div key={report.id} className="rounded-lg border p-4">
                <div className="font-semibold">#{report.id} | {report.reason} | 狀態：{report.status}</div>
                <div className="text-sm text-muted-foreground mt-1">教練：{report.coachName || "未提供"}</div>
                {report.description ? <div className="text-sm mt-1">{report.description}</div> : null}
                <div className="text-xs text-muted-foreground mt-1">{report.createdAt ? new Date(report.createdAt).toLocaleString() : ""}</div>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={() =>
                      runAction(
                        `report-resolve-${report.id}`,
                        () => fetch(`${getBaseUrl()}/api/admin/reports/${report.id}`, {
                          method: "PATCH",
                          headers: { ...authHeaders, "Content-Type": "application/json" },
                          body: JSON.stringify({ status: "resolved" }),
                        }),
                        async () => { await refetchReports(); },
                      )
                    }
                  >
                    標記已解決
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      runAction(
                        `report-pending-${report.id}`,
                        () => fetch(`${getBaseUrl()}/api/admin/reports/${report.id}`, {
                          method: "PATCH",
                          headers: { ...authHeaders, "Content-Type": "application/json" },
                          body: JSON.stringify({ status: "pending" }),
                        }),
                        async () => { await refetchReports(); },
                      )
                    }
                  >
                    標記待處理
                  </Button>
                </div>
              </div>
            )) : <p>暫無舉報。</p>}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              評價會自動公開；如出現離題、暴力、性別歧視或廣告內容，可在此移除並留下原因。沒有操作即代表保留。
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={reviewStatusFilter === "all" ? "default" : "outline"} onClick={() => setReviewStatusFilter("all")}>全部</Button>
              <Button size="sm" variant={reviewStatusFilter === "unreviewed" ? "default" : "outline"} onClick={() => setReviewStatusFilter("unreviewed")}>未審核</Button>
              <Button size="sm" variant={reviewStatusFilter === "kept" ? "default" : "outline"} onClick={() => setReviewStatusFilter("kept")}>已閱讀，保留</Button>
              <Button size="sm" variant={reviewStatusFilter === "removed" ? "default" : "outline"} onClick={() => setReviewStatusFilter("removed")}>已移除</Button>
            </div>
            {isLoadingReviews ? <p>載入中...</p> : null}
            {filteredReviews.length ? filteredReviews.map((review) => {
              const selectedReason = reviewRemoveReasonById[review.id] ?? "unrelated content";
              const isRemoved = !!review.isRemoved || review.comment.toLowerCase().startsWith("removed by admin due to");
              return (
                <div key={review.id} className="rounded-lg border p-4">
                  <div className="font-semibold">
                    #{review.id} | Coach #{review.coachId ?? "-"} | {review.userName || "匿名"} | {review.rating}/5
                  </div>
                  <div className={`text-sm mt-1 ${isRemoved ? "text-red-700" : ""}`}>{review.comment}</div>
                  <div className="text-xs text-muted-foreground mt-1">{new Date(review.createdAt).toLocaleString()}</div>
                  {isRemoved && review.removedAt ? (
                    <div className="text-[11px] text-muted-foreground mt-1">
                      移除時間：{new Date(review.removedAt).toLocaleString()}
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-2 mt-3 items-center">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={busyAction === `review-keep-${review.id}` || isRemoved || review.removedReason === "reviewed_keep"}
                      onClick={() =>
                        runAction(
                          `review-keep-${review.id}`,
                          () =>
                            fetch(`${getBaseUrl()}/api/admin/reviews/${review.id}/keep`, {
                              method: "POST",
                              headers: authHeaders,
                            }),
                          async () => {
                            await refetchReviews();
                          },
                        )
                      }
                    >
                      {review.removedReason === "reviewed_keep" ? "已標記保留" : "已閱讀，保留"}
                    </Button>
                    <select
                      className="h-8 rounded border px-2 text-xs bg-background"
                      value={selectedReason}
                      onChange={(e) => setReviewRemoveReasonById((prev) => ({ ...prev, [review.id]: e.target.value }))}
                    >
                      <option value="unrelated content">離題內容</option>
                      <option value="violence">暴力內容</option>
                      <option value="sexist content">性別歧視內容</option>
                      <option value="unrelated advertising">廣告/導流內容</option>
                    </select>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={busyAction === `review-remove-${review.id}` || isRemoved}
                      onClick={() =>
                        runAction(
                          `review-remove-${review.id}`,
                          () => fetch(`${getBaseUrl()}/api/admin/reviews/${review.id}/remove`, {
                            method: "POST",
                            headers: { ...authHeaders, "Content-Type": "application/json" },
                            body: JSON.stringify({ removedReason: selectedReason }),
                          }),
                          async () => { await refetchReviews(); },
                        )
                      }
                    >
                      {isRemoved ? "已移除" : "移除留言"}
                    </Button>
                  </div>
                </div>
              );
            }) : <p>暫無評價。</p>}
          </div>
        )}

        {activeTab === "allCoaches" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              你可在此控制教練是否上架、拒絕申請、設為精選，並檢視資歷與證書連結作審核用途。
            </p>
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex flex-col md:flex-row gap-2 md:items-center">
                <Input
                  value={coachSearchInput}
                  onChange={(e) => setCoachSearchInput(e.target.value)}
                  placeholder="搜尋教練姓名 / 運動 / 地區"
                  className="md:max-w-sm"
                />
                <Button size="sm" onClick={() => setCoachSearch(coachSearchInput)}>搜尋</Button>
                <Button size="sm" variant="outline" onClick={() => {
                  setCoachSearchInput("");
                  setCoachSearch("");
                }}>
                  清除搜尋
                </Button>
                <Button size="sm" variant="outline" onClick={() => refetchAllCoaches()}>
                  重新整理
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant={coachStatusFilter === "all" ? "default" : "outline"} onClick={() => setCoachStatusFilter("all")}>全部</Button>
                <Button size="sm" variant={coachStatusFilter === "active" ? "default" : "outline"} onClick={() => setCoachStatusFilter("active")}>已批准</Button>
                <Button size="sm" variant={coachStatusFilter === "inactive" ? "default" : "outline"} onClick={() => setCoachStatusFilter("inactive")}>待審核</Button>
                <Button size="sm" variant={coachStatusFilter === "rejected" ? "default" : "outline"} onClick={() => setCoachStatusFilter("rejected")}>已拒絕</Button>
              </div>
            </div>

            {isLoadingAllCoaches ? <p>載入中...</p> : null}

            {!isLoadingAllCoaches && !allCoachesData?.coaches?.length ? (
              <p>沒有符合條件的教練資料。</p>
            ) : null}

            {allCoachesData?.coaches?.length ? (
              <div className="rounded-lg border overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-semibold bg-muted/60 border-b">
                  <div className="col-span-1">ID</div>
                  <div className="col-span-2">姓名</div>
                  <div className="col-span-2">運動</div>
                  <div className="col-span-2">地區</div>
                  <div className="col-span-2">狀態</div>
                  <div className="col-span-2">建立時間</div>
                  <div className="col-span-1 text-right">操作</div>
                </div>
                {allCoachesData.coaches.map((coach) => {
                  const statusLabel = coach.isRejected ? "已拒絕" : coach.isApproved ? "已批准" : "待審核";
                  const qualifications = parseJsonArray<QualificationItem>(coach.qualifications).map((q) => ({
                    ...q,
                    status: q.status ?? "pending",
                  }));
                  const pricingPlans = parseJsonArray<PricingPlanItem>(coach.pricingPlans);
                  const coachPendingPhotos = (pendingPhotos ?? []).filter((p) => p.coachId === coach.id);
                  const coachPendingPosts = (pendingPosts ?? []).filter((p) => p.coachId === coach.id);
                  return (
                    <div key={coach.id} className="border-b last:border-b-0">
                      <div className="grid grid-cols-12 gap-2 px-4 py-3 text-sm items-center">
                        <div className="col-span-1 text-muted-foreground">#{coach.id}</div>
                        <div className="col-span-2 font-medium">{coach.name}</div>
                        <div className="col-span-2">{coach.sportsCategory}</div>
                        <div className="col-span-2">{coach.location}</div>
                        <div className="col-span-2">
                          <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                            {statusLabel}
                          </span>
                          {coach.isFeatured ? <span className="ml-2 text-xs text-primary">精選</span> : null}
                        </div>
                        <div className="col-span-2 text-xs text-muted-foreground">{new Date(coach.createdAt).toLocaleString()}</div>
                        <div className="col-span-1 text-right">
                          <Link href={`/coaches/${coach.id}`}>
                            <Button size="sm" variant="outline">查看</Button>
                          </Link>
                        </div>
                      </div>

                      <div className="px-4 pb-3">
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Button
                            size="sm"
                            onClick={() =>
                              runAction(
                                `all-coach-approve-${coach.id}`,
                                () => fetch(`${getBaseUrl()}/api/admin/coaches/${coach.id}/approve`, { method: "POST", headers: authHeaders }),
                                async () => { await refetchAllCoaches(); await refetchCoaches(); },
                              )
                            }
                            disabled={busyAction === `all-coach-approve-${coach.id}`}
                          >
                            上架 / 通過
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              runAction(
                                `all-coach-off-${coach.id}`,
                                () => fetch(`${getBaseUrl()}/api/admin/coaches/${coach.id}/status`, {
                                  method: "PATCH",
                                  headers: { ...authHeaders, "Content-Type": "application/json" },
                                  body: JSON.stringify({ isApproved: false }),
                                }),
                                async () => { await refetchAllCoaches(); await refetchCoaches(); },
                              )
                            }
                            disabled={busyAction === `all-coach-off-${coach.id}`}
                          >
                            下架
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              runAction(
                                `all-coach-reject-${coach.id}`,
                                () => fetch(`${getBaseUrl()}/api/admin/coaches/${coach.id}/reject`, { method: "POST", headers: authHeaders }),
                                async () => { await refetchAllCoaches(); await refetchCoaches(); },
                              )
                            }
                            disabled={busyAction === `all-coach-reject-${coach.id}`}
                          >
                            拒絕
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              runAction(
                                `all-coach-feature-${coach.id}`,
                                () => fetch(`${getBaseUrl()}/api/admin/coaches/${coach.id}/featured`, {
                                  method: "PATCH",
                                  headers: { ...authHeaders, "Content-Type": "application/json" },
                                  body: JSON.stringify({ isFeatured: !coach.isFeatured }),
                                }),
                                async () => { await refetchAllCoaches(); },
                              )
                            }
                            disabled={busyAction === `all-coach-feature-${coach.id}`}
                          >
                            {coach.isFeatured ? "取消精選" : "設為精選"}
                          </Button>
                        </div>

                        <details className="rounded border bg-muted/20">
                          <summary className="cursor-pointer px-3 py-2 text-sm font-medium">查看教練資料 / 資歷 / 證書</summary>
                          <div className="px-3 pb-3 pt-1 text-sm space-y-3">
                            <div>
                              <div className="text-xs text-muted-foreground">聯絡</div>
                              <div>{coach.whatsappNumber || "未提供"}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">經驗</div>
                              <div>{coach.experienceLevel || "未提供"}</div>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${coach.isProfessionalAthleteVerified ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-50 text-slate-600 border-slate-200"}`}>
                                  專業運動員：{coach.isProfessionalAthleteVerified ? "已核實" : "未核實"}
                                </span>
                                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${coach.isLicensedCoachVerified ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-50 text-slate-600 border-slate-200"}`}>
                                  持牌教練：{coach.isLicensedCoachVerified ? "已核實" : "未核實"}
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">簡介</div>
                              <div>{coach.bio || "未提供"}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">套票詳情</div>
                              <div>{coach.packageDetails || "未提供"}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">收費計劃</div>
                              {pricingPlans.length ? (
                                <div className="space-y-1">
                                  {pricingPlans.map((plan, i) => (
                                    <div key={`${coach.id}-plan-${i}`} className="text-xs rounded border px-2 py-1 bg-background">
                                      {plan.sessionType || "課堂"} | ${plan.price ?? "-"} | {plan.duration || "-"} | {plan.ageGroup || "所有年齡"}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-xs">未提供</div>
                              )}
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">資歷 / 證書</div>
                              {qualifications.length ? (
                                <div className="space-y-2">
                                  {qualifications.map((q, i) => (
                                    <div key={`${coach.id}-qual-${i}`} className="text-xs rounded border px-2 py-1 bg-background">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="font-medium">{q.text || "未命名資歷"}</div>
                                        <span
                                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${
                                            q.status === "approved"
                                              ? "bg-green-50 text-green-700 border-green-200"
                                              : q.status === "denied"
                                                ? "bg-red-50 text-red-700 border-red-200"
                                                : "bg-slate-50 text-slate-600 border-slate-200"
                                          }`}
                                        >
                                          {q.status === "approved" ? "已核實" : q.status === "denied" ? "已拒絕" : "待核實"}
                                        </span>
                                      </div>
                                      {q.proofUrl ? (
                                        <a className="text-primary underline break-all" href={q.proofUrl} target="_blank" rel="noreferrer">
                                          {q.proofUrl.startsWith("data:application/pdf") ? "查看 PDF 證書" : "查看證書"}
                                        </a>
                                      ) : (
                                        <div className="text-muted-foreground">未附證書</div>
                                      )}
                                      <div className="flex gap-2 mt-2">
                                        <Button
                                          size="sm"
                                          className="h-7 px-2 text-[11px]"
                                          disabled={busyAction === `coach-qualification-${coach.id}-${i}-approved`}
                                          onClick={() => updateQualificationStatus(coach, i, "approved")}
                                        >
                                          通過
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          className="h-7 px-2 text-[11px]"
                                          disabled={busyAction === `coach-qualification-${coach.id}-${i}-denied`}
                                          onClick={() => updateQualificationStatus(coach, i, "denied")}
                                        >
                                          拒絕
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-xs">未提供</div>
                              )}
                            </div>
                          </div>
                        </details>

                        <details className="rounded border bg-muted/20 mt-3">
                          <summary className="cursor-pointer px-3 py-2 text-sm font-medium">審核工作台（Verification）</summary>
                          <div className="px-3 pb-3 pt-1 text-sm space-y-3">
                            <div className="rounded border bg-background p-3">
                              <p className="text-xs text-muted-foreground mb-2">Profile 申請</p>
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${coach.isApproved ? "bg-green-50 text-green-700 border-green-200" : coach.isRejected ? "bg-red-50 text-red-700 border-red-200" : "bg-slate-50 text-slate-600 border-slate-200"}`}>
                                  {coach.isApproved ? "已批准上架" : coach.isRejected ? "已拒絕" : "待審核"}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="h-7 px-2 text-[11px]"
                                  disabled={busyAction === `verify-coach-approve-${coach.id}`}
                                  onClick={() =>
                                    runAction(
                                      `verify-coach-approve-${coach.id}`,
                                      () => fetch(`${getBaseUrl()}/api/admin/coaches/${coach.id}/approve`, { method: "POST", headers: authHeaders }),
                                      async () => { await refetchAllCoaches(); await refetchCoaches(); },
                                    )
                                  }
                                >
                                  批准上架
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-7 px-2 text-[11px]"
                                  disabled={busyAction === `verify-coach-reject-${coach.id}`}
                                  onClick={() =>
                                    runAction(
                                      `verify-coach-reject-${coach.id}`,
                                      () => fetch(`${getBaseUrl()}/api/admin/coaches/${coach.id}/reject`, { method: "POST", headers: authHeaders }),
                                      async () => { await refetchAllCoaches(); await refetchCoaches(); },
                                    )
                                  }
                                >
                                  拒絕申請
                                </Button>
                              </div>
                            </div>

                            <div className="rounded border bg-background p-3">
                              <p className="text-xs text-muted-foreground mb-2">Qualifications 證書</p>
                              <p className="text-xs">請於上方「查看教練資料 / 資歷 / 證書」逐張按通過 / 拒絕。</p>
                            </div>

                            <div className="rounded border bg-background p-3">
                              <p className="text-xs text-muted-foreground mb-2">類別核實（影響首頁篩選）</p>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  className="h-7 px-2 text-[11px]"
                                  disabled={busyAction === `coach-category-${coach.id}-isProfessionalAthleteVerified-on`}
                                  onClick={() => updateCoachCategoryVerification(coach, "isProfessionalAthleteVerified", true)}
                                >
                                  核實為專業運動員
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-[11px]"
                                  disabled={busyAction === `coach-category-${coach.id}-isProfessionalAthleteVerified-off`}
                                  onClick={() => updateCoachCategoryVerification(coach, "isProfessionalAthleteVerified", false)}
                                >
                                  取消專業運動員
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-7 px-2 text-[11px]"
                                  disabled={busyAction === `coach-category-${coach.id}-isLicensedCoachVerified-on`}
                                  onClick={() => updateCoachCategoryVerification(coach, "isLicensedCoachVerified", true)}
                                >
                                  核實為持牌教練
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-[11px]"
                                  disabled={busyAction === `coach-category-${coach.id}-isLicensedCoachVerified-off`}
                                  onClick={() => updateCoachCategoryVerification(coach, "isLicensedCoachVerified", false)}
                                >
                                  取消持牌教練
                                </Button>
                              </div>
                            </div>

                            <div className="rounded border bg-background p-3">
                              <p className="text-xs text-muted-foreground mb-2">Photos 相片（待審：{coachPendingPhotos.length}）</p>
                              {coachPendingPhotos.length === 0 ? (
                                <p className="text-xs text-muted-foreground">此教練暫無待審相片。</p>
                              ) : (
                                <div className="space-y-2">
                                  {coachPendingPhotos.map((photo) => (
                                    <div key={photo.id} className="rounded border p-2">
                                      <img src={photo.imageUrl} alt={`pending-photo-${photo.id}`} className="w-28 h-28 object-cover rounded border mb-2" />
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          className="h-7 px-2 text-[11px]"
                                          disabled={busyAction === `verify-photo-approve-${photo.id}`}
                                          onClick={() =>
                                            runAction(
                                              `verify-photo-approve-${photo.id}`,
                                              () => fetch(`${getBaseUrl()}/api/admin/photos/${photo.id}/approve`, { method: "POST", headers: authHeaders }),
                                              async () => { await refetchPhotos(); },
                                            )
                                          }
                                        >
                                          通過
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          className="h-7 px-2 text-[11px]"
                                          disabled={busyAction === `verify-photo-reject-${photo.id}`}
                                          onClick={() =>
                                            runAction(
                                              `verify-photo-reject-${photo.id}`,
                                              () => fetch(`${getBaseUrl()}/api/admin/photos/${photo.id}/reject`, { method: "POST", headers: authHeaders }),
                                              async () => { await refetchPhotos(); },
                                            )
                                          }
                                        >
                                          拒絕
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="rounded border bg-background p-3">
                              <p className="text-xs text-muted-foreground mb-2">Posts 貼文（待審：{coachPendingPosts.length}）</p>
                              {isLoadingPendingPosts ? (
                                <p className="text-xs text-muted-foreground">載入中...</p>
                              ) : coachPendingPosts.length === 0 ? (
                                <p className="text-xs text-muted-foreground">此教練暫無待審貼文。</p>
                              ) : (
                                <div className="space-y-2">
                                  {coachPendingPosts.map((post) => (
                                    <div key={post.id} className="rounded border p-2">
                                      <p className="text-xs mb-2">{post.caption || "（無文字）"}</p>
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          className="h-7 px-2 text-[11px]"
                                          disabled={busyAction === `verify-post-approve-${post.id}`}
                                          onClick={() =>
                                            runAction(
                                              `verify-post-approve-${post.id}`,
                                              () => fetch(`${getBaseUrl()}/api/admin/posts/${post.id}/approve`, { method: "PUT", headers: authHeaders }),
                                              async () => { await refetchPendingPosts(); },
                                            )
                                          }
                                        >
                                          通過
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          className="h-7 px-2 text-[11px]"
                                          disabled={busyAction === `verify-post-reject-${post.id}`}
                                          onClick={() =>
                                            runAction(
                                              `verify-post-reject-${post.id}`,
                                              () => fetch(`${getBaseUrl()}/api/admin/posts/${post.id}/reject`, {
                                                method: "PUT",
                                                headers: { ...authHeaders, "Content-Type": "application/json" },
                                                body: JSON.stringify({ reason: "未達內容審核標準" }),
                                              }),
                                              async () => { await refetchPendingPosts(); },
                                            )
                                          }
                                        >
                                          拒絕
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="rounded border bg-background p-3">
                              <p className="text-xs text-muted-foreground mb-2">YouTube 影片</p>
                              {coach.youtubePending ? (
                                <>
                                  <a
                                    href={coach.youtubePending}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-primary underline break-all"
                                  >
                                    {coach.youtubePending}
                                  </a>
                                  <div className="flex gap-2 mt-2">
                                    <Button
                                      size="sm"
                                      className="h-7 px-2 text-[11px]"
                                      disabled={busyAction === `verify-youtube-approve-${coach.id}`}
                                      onClick={() =>
                                        runAction(
                                          `verify-youtube-approve-${coach.id}`,
                                          () => fetch(`${getBaseUrl()}/api/admin/coaches/${coach.id}/youtube/approve`, { method: "PATCH", headers: authHeaders }),
                                          async () => { await refetchAllCoaches(); },
                                        )
                                      }
                                    >
                                      通過
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="h-7 px-2 text-[11px]"
                                      disabled={busyAction === `verify-youtube-reject-${coach.id}`}
                                      onClick={() =>
                                        runAction(
                                          `verify-youtube-reject-${coach.id}`,
                                          () => fetch(`${getBaseUrl()}/api/admin/coaches/${coach.id}/youtube/reject`, { method: "PATCH", headers: authHeaders }),
                                          async () => { await refetchAllCoaches(); },
                                        )
                                      }
                                    >
                                      拒絕
                                    </Button>
                                  </div>
                                </>
                              ) : (
                                <p className="text-xs text-muted-foreground">此教練暫無待審 YouTube 影片。</p>
                              )}
                            </div>
                          </div>
                        </details>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </Layout>
  );
}
