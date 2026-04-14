import { Layout } from "@/components/layout";
import { useUser } from "@clerk/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminListPendingCoaches, useAdminApproveCoach, useAdminRejectCoach, useAdminListPendingReviews, useAdminApproveReview, useAdminRejectReview, useAdminListPendingPhotos, useAdminApprovePhoto, useAdminRejectPhoto } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Check, X, ShieldAlert, ShieldCheck, Loader2, Copy } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getAdminListPendingCoachesQueryKey, getAdminListPendingReviewsQueryKey, getAdminListPendingPhotosQueryKey, getListCoachesQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useAdminStatus } from "@/hooks/use-admin-status";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { user, isSignedIn, isLoaded } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: adminStatus, isLoading: isAdminLoading } = useAdminStatus();

  const { data: pendingCoaches } = useAdminListPendingCoaches({ request: { credentials: "include" } });
  const { data: pendingReviews } = useAdminListPendingReviews({ request: { credentials: "include" } });
  const { data: pendingPhotos } = useAdminListPendingPhotos({ request: { credentials: "include" } });

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
          <TabsList className="mb-6">
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
        </Tabs>
      </div>
    </Layout>
  );
}
