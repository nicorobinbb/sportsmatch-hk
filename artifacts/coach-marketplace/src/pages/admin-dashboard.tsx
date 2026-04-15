import { Layout } from "@/components/layout";
import { useUser } from "@clerk/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminListPendingCoaches, useAdminApproveCoach, useAdminRejectCoach, useAdminListPendingReviews, useAdminApproveReview, useAdminRejectReview, useAdminListPendingPhotos, useAdminApprovePhoto, useAdminRejectPhoto } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Check, X, ShieldAlert, ShieldCheck, Loader2, Copy, BarChart3, Flag } from "lucide-react";
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

  useEffect(() => {
    if (!adminStatus?.isAdmin) return;
    getAuthToken().then(token => {
      const headers = { Authorization: `Bearer ${token}` };
      fetch(`${getBaseUrl()}/api/admin/analytics`, { headers })
        .then(r => r.json()).then(d => setAnalytics(d)).catch(() => {});
      fetch(`${getBaseUrl()}/api/admin/reports`, { headers })
        .then(r => r.json()).then(d => setReports(d.reports || [])).catch(() => {});
    });
  }, [adminStatus?.isAdmin]);

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

        <Tabs defaultValue="coaches" className="w-full">
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="coaches" className="flex gap-2">
              待審核教練
              {pendingCoaches && pendingCoaches.length > 0 && (
                <Badge variant="destructive" className="px-1.5 min-w-[20px] h-5">{pendingCoaches.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex gap-2">
              待審核評價
              {pendingReviews && pendingReviews.length > 0 && (
                <Badge variant="destructive" className="px-1.5 min-w-[20px] h-5">{pendingReviews.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex gap-2">
              待審核相片
              {pendingPhotos && pendingPhotos.length > 0 && (
                <Badge variant="destructive" className="px-1.5 min-w-[20px] h-5">{pendingPhotos.length}</Badge>
              )}
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
          </TabsList>

          <TabsContent value="coaches" className="space-y-4">
            {pendingCoaches?.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-card rounded-xl border text-muted-foreground">
                暫無待審核的教練。
              </div>
            ) : (
              <div className="grid gap-4">
                {pendingCoaches?.map(coach => (
                  <div key={coach.id} className="bg-white dark:bg-card p-6 rounded-xl border shadow-sm flex flex-col md:flex-row justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg">{coach.name}</h3>
                        <Badge variant="secondary">{coach.sportsCategory}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{coach.bio}</p>
                      <div className="flex gap-4 text-sm font-medium">
                        <span>體驗堂：${coach.trialPrice}</span>
                        <span>正課：${coach.regularPrice}</span>
                        <span>地點：{coach.location}</span>
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

          <TabsContent value="reviews" className="space-y-4">
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

          <TabsContent value="photos" className="space-y-4">
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
