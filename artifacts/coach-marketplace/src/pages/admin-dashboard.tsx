import { Layout } from "@/components/layout";
import { Show, useUser } from "@clerk/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminListPendingCoaches, useAdminApproveCoach, useAdminRejectCoach, useAdminListPendingReviews, useAdminApproveReview, useAdminRejectReview, useAdminListPendingPhotos, useAdminApprovePhoto, useAdminRejectPhoto } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Check, X, ShieldAlert } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getAdminListPendingCoachesQueryKey, getAdminListPendingReviewsQueryKey, getAdminListPendingPhotosQueryKey, getListCoachesQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingCoaches } = useAdminListPendingCoaches();
  const { data: pendingReviews } = useAdminListPendingReviews();
  const { data: pendingPhotos } = useAdminListPendingPhotos();

  const approveCoach = useAdminApproveCoach();
  const rejectCoach = useAdminRejectCoach();
  const approveReview = useAdminApproveReview();
  const rejectReview = useAdminRejectReview();
  const approvePhoto = useAdminApprovePhoto();
  const rejectPhoto = useAdminRejectPhoto();

  const handleApproveCoach = (id: number) => {
    approveCoach.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Coach approved" });
        queryClient.invalidateQueries({ queryKey: getAdminListPendingCoachesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListCoachesQueryKey() });
      }
    });
  };

  const handleRejectCoach = (id: number) => {
    rejectCoach.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Coach rejected" });
        queryClient.invalidateQueries({ queryKey: getAdminListPendingCoachesQueryKey() });
      }
    });
  };

  const handleApproveReview = (id: number) => {
    approveReview.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Review approved" });
        queryClient.invalidateQueries({ queryKey: getAdminListPendingReviewsQueryKey() });
      }
    });
  };

  const handleRejectReview = (id: number) => {
    rejectReview.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Review rejected" });
        queryClient.invalidateQueries({ queryKey: getAdminListPendingReviewsQueryKey() });
      }
    });
  };

  const handleApprovePhoto = (id: number) => {
    approvePhoto.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Photo approved" });
        queryClient.invalidateQueries({ queryKey: getAdminListPendingPhotosQueryKey() });
      }
    });
  };

  const handleRejectPhoto = (id: number) => {
    rejectPhoto.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Photo rejected" });
        queryClient.invalidateQueries({ queryKey: getAdminListPendingPhotosQueryKey() });
      }
    });
  };

  return (
    <Layout>
      <div className="container px-4 md:px-6 py-12 flex-1">
        <Show when="signed-out">
          <div className="text-center py-20 bg-white dark:bg-card rounded-2xl border shadow-sm">
            <ShieldAlert className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold font-display mb-4">Admin Access Required</h2>
            <p className="text-muted-foreground">You must be signed in as an admin to view this page.</p>
          </div>
        </Show>

        <Show when="signed-in">
          <div className="mb-8">
            <h1 className="text-3xl font-bold font-display mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage pending marketplace content.</p>
          </div>

          <Tabs defaultValue="coaches" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="coaches" className="flex gap-2">
                Pending Coaches
                {pendingCoaches && pendingCoaches.length > 0 && (
                  <Badge variant="destructive" className="px-1.5 min-w-[20px] h-5">{pendingCoaches.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="reviews" className="flex gap-2">
                Pending Reviews
                {pendingReviews && pendingReviews.length > 0 && (
                  <Badge variant="destructive" className="px-1.5 min-w-[20px] h-5">{pendingReviews.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="photos" className="flex gap-2">
                Pending Photos
                {pendingPhotos && pendingPhotos.length > 0 && (
                  <Badge variant="destructive" className="px-1.5 min-w-[20px] h-5">{pendingPhotos.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="coaches" className="space-y-4">
              {pendingCoaches?.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-card rounded-xl border text-muted-foreground">
                  No pending coaches.
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
                          <span>Trial: ${coach.trialPrice}</span>
                          <span>Regular: ${coach.regularPrice}</span>
                          <span>Location: {coach.location}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleApproveCoach(coach.id)} disabled={approveCoach.isPending}>
                          <Check className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleRejectCoach(coach.id)} disabled={rejectCoach.isPending}>
                          <X className="w-4 h-4 mr-1" /> Reject
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
                  No pending reviews.
                </div>
              ) : (
                <div className="grid gap-4">
                  {pendingReviews?.map(review => (
                    <div key={review.id} className="bg-white dark:bg-card p-6 rounded-xl border shadow-sm flex flex-col md:flex-row justify-between gap-6">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold">{review.userName || "Anonymous"}</span>
                          <Badge variant="secondary">Rating: {review.rating}/5</Badge>
                          <span className="text-xs text-muted-foreground">Coach ID: {review.coachId}</span>
                        </div>
                        <p className="text-sm">{review.comment}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleApproveReview(review.id)} disabled={approveReview.isPending}>
                          <Check className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleRejectReview(review.id)} disabled={rejectReview.isPending}>
                          <X className="w-4 h-4 mr-1" /> Reject
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
                  No pending photos.
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
        </Show>
      </div>
    </Layout>
  );
}
