import { Layout } from "@/components/layout";
import { useParams } from "wouter";
import { useGetCoach, useGetCoachReviews, useGetCoachPhotos, useCreateReview } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Star, CheckCircle2, Award, Calendar, MessageSquare, Image as ImageIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Show, useUser } from "@clerk/react";

export default function CoachProfile() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const { toast } = useToast();
  const { user } = useUser();

  const { data: coach, isLoading: isCoachLoading } = useGetCoach(id, {
    query: { enabled: !!id }
  });

  const { data: reviews, isLoading: isReviewsLoading, refetch: refetchReviews } = useGetCoachReviews(id, {
    query: { enabled: !!id }
  });

  const { data: photos, isLoading: isPhotosLoading } = useGetCoachPhotos(id, {
    query: { enabled: !!id }
  });

  const createReview = useCreateReview();
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return;

    createReview.mutate({
      data: {
        coachId: id,
        rating: reviewRating,
        comment: reviewText,
        userName: user?.fullName || user?.firstName || "匿名用戶"
      }
    }, {
      onSuccess: () => {
        toast({
          title: "評價已提交",
          description: "你的評價已收到，正等候審核。",
        });
        setReviewText("");
        setReviewRating(5);
      },
      onError: (err) => {
        toast({
          title: "提交失敗",
          description: "無法提交評價，請稍後再試。",
          variant: "destructive",
        });
      }
    });
  };

  if (isCoachLoading) {
    return (
      <Layout>
        <div className="container px-4 py-8">
          <Skeleton className="w-full h-64 rounded-xl mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="w-1/2 h-10" />
              <Skeleton className="w-full h-32" />
            </div>
            <div>
              <Skeleton className="w-full h-64 rounded-xl" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!coach) {
    return (
      <Layout>
        <div className="container px-4 py-24 text-center">
          <h1 className="text-2xl font-bold">找不到此教練</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-slate-50 dark:bg-background pb-12 flex-1">
        {/* Header Cover */}
        <div className="h-48 md:h-64 bg-gradient-to-r from-primary to-secondary w-full relative">
          <div className="absolute inset-0 bg-black/10" />
        </div>

        <div className="container px-4 md:px-6 -mt-20 relative z-10">
          <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start">
            
            {/* Left Column: Profile Info */}
            <div className="flex-1 w-full space-y-6">
              <div className="bg-white dark:bg-card rounded-2xl p-6 md:p-8 shadow-sm border flex flex-col md:flex-row gap-6 items-start">
                <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-white shadow-md bg-white">
                  <AvatarImage src={coach.profileImageUrl || undefined} alt={coach.name} className="object-cover" />
                  <AvatarFallback className="text-4xl font-bold bg-primary/10 text-primary">{coach.name.charAt(0)}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge variant="secondary" className="font-medium bg-primary/10 text-primary border-0 hover:bg-primary/20">
                      {coach.sportsCategory}
                    </Badge>
                    {coach.isApproved && (
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 gap-1">
                        <CheckCircle2 className="w-3 h-3" /> 已認證
                      </Badge>
                    )}
                  </div>
                  
                  <h1 className="text-3xl md:text-4xl font-display font-bold flex items-center gap-2">
                    {coach.name}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm font-medium">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" /> {coach.location}
                    </span>
                    <span className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-md">
                      <Star className="w-4 h-4 fill-current" /> 
                      {coach.averageRating ? coach.averageRating.toFixed(1) : "新"} 
                      <span className="opacity-70 font-normal">（{coach.reviewCount} 個評價）</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Award className="w-4 h-4" /> {coach.experienceLevel}
                    </span>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="about" className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent mb-6">
                  <TabsTrigger value="about" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 px-6 text-base font-medium">關於教練</TabsTrigger>
                  <TabsTrigger value="photos" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 px-6 text-base font-medium">相片</TabsTrigger>
                  <TabsTrigger value="reviews" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 px-6 text-base font-medium">學員評價</TabsTrigger>
                </TabsList>
                
                <TabsContent value="about" className="space-y-6 animate-in fade-in-50">
                  <div className="bg-white dark:bg-card rounded-2xl p-6 md:p-8 shadow-sm border">
                    <h3 className="text-xl font-bold font-display mb-4">關於此教練</h3>
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">{coach.bio}</p>
                    </div>

                    <div className="mt-8 pt-8 border-t grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">適合年齡組別</h4>
                        <div className="flex flex-wrap gap-2">
                          {coach.ageGroups.map(age => (
                            <Badge key={age} variant="secondary" className="bg-slate-100">{age}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">課程套餐詳情</h4>
                        <p className="text-sm text-foreground">{coach.packageDetails || "標準按小時計費。"}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="photos" className="animate-in fade-in-50">
                  <div className="bg-white dark:bg-card rounded-2xl p-6 md:p-8 shadow-sm border">
                    <h3 className="text-xl font-bold font-display mb-6 flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-primary" /> 訓練相片
                    </h3>
                    
                    {isPhotosLoading ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="aspect-square rounded-xl" />)}
                      </div>
                    ) : photos && photos.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {photos.map(photo => (
                          <div key={photo.id} className="aspect-square rounded-xl overflow-hidden border group relative">
                            <img src={photo.imageUrl} alt="Training" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed">
                        暫未上傳相片。
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="reviews" className="animate-in fade-in-50 space-y-6">
                  <div className="bg-white dark:bg-card rounded-2xl p-6 md:p-8 shadow-sm border">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold font-display flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary" /> 學員評價
                      </h3>
                      <div className="flex items-center gap-1 text-lg font-bold">
                        <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                        {coach.averageRating ? coach.averageRating.toFixed(1) : "N/A"}
                      </div>
                    </div>

                    <Show when="signed-in">
                      <form onSubmit={handleSubmitReview} className="mb-8 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border">
                        <h4 className="font-semibold mb-3">撰寫評價</h4>
                        <div className="flex gap-1 mb-3">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => setReviewRating(rating)}
                              className="text-2xl focus:outline-none"
                            >
                              <Star className={`w-6 h-6 ${rating <= reviewRating ? 'fill-amber-500 text-amber-500' : 'text-slate-300'}`} />
                            </button>
                          ))}
                        </div>
                        <Textarea 
                          placeholder="分享你與此教練的上課體驗…"
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          className="mb-3 bg-white"
                          required
                        />
                        <Button type="submit" disabled={createReview.isPending}>
                          {createReview.isPending ? "提交中…" : "提交評價"}
                        </Button>
                      </form>
                    </Show>

                    <Show when="signed-out">
                      <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-900 rounded-xl border text-center">
                        <p className="text-muted-foreground mb-3">請先登入才能留下評價。</p>
                      </div>
                    </Show>
                    
                    <div className="space-y-6">
                      {isReviewsLoading ? (
                        <div className="space-y-4">
                          {[1, 2].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
                        </div>
                      ) : reviews && reviews.length > 0 ? (
                        reviews.map(review => (
                          <div key={review.id} className="pb-6 border-b last:border-0 last:pb-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-semibold">{review.userName || "匿名用戶"}</div>
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <Star key={star} className={`w-3.5 h-3.5 ${star <= review.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-200'}`} />
                                ))}
                              </div>
                            </div>
                            <p className="text-muted-foreground text-sm leading-relaxed">{review.comment}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          暫無評價，成為第一個留下評價的人！
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Column: Pricing Card */}
            <div className="w-full md:w-80 lg:w-96 shrink-0 md:sticky md:top-24">
              <Card className="border-primary/20 shadow-lg overflow-hidden">
                <div className="bg-primary/5 p-4 border-b text-center">
                  <span className="font-display font-bold text-primary tracking-wide">明碼實價</span>
                </div>
                <CardContent className="p-6 space-y-6">
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm font-medium text-muted-foreground">
                      <span>體驗堂</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">首次優惠</Badge>
                    </div>
                    <div className="text-4xl font-display font-bold text-foreground">
                      ${coach.trialPrice}
                    </div>
                  </div>

                  <div className="w-full h-px bg-border" />

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm font-medium text-muted-foreground">
                      <span>正課</span>
                      <span>每小時</span>
                    </div>
                    <div className="text-3xl font-display font-bold text-foreground">
                      ${coach.regularPrice}
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button className="w-full text-lg h-12 rounded-xl font-bold" size="lg">
                      <Calendar className="w-5 h-5 mr-2" />
                      聯絡教練
                    </Button>
                    <p className="text-xs text-center text-muted-foreground mt-3">
                      透過運動平台安全付款。
                    </p>
                  </div>

                </CardContent>
              </Card>
            </div>
            
          </div>
        </div>
      </div>
    </Layout>
  );
}
