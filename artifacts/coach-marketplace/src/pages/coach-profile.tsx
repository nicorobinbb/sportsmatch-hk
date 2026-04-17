import { Layout } from "@/components/layout";
import { useParams } from "wouter";
import { useGetCoach, useGetCoachReviews, useGetCoachPhotos, useCreateReview } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Star, CheckCircle2, Award, Trophy, MessageSquare, Image as ImageIcon, Phone, Heart, Flag, ThumbsUp, Upload, Clock, Trash2, Loader2, Youtube, Send, X, PlusCircle, Newspaper, ImagePlus, Facebook, Instagram, Share2, Copy, Mail } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Show, useUser } from "@clerk/react";
import { getBaseUrl } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-token";

function ShareCoachButton({ coach }: { coach: any }) {
  const { toast } = useToast();
  const url = typeof window !== "undefined" ? window.location.href : "";
  const rating = typeof coach.averageRating === "number" && coach.reviewCount > 0
    ? `⭐ ${coach.averageRating.toFixed(1)}／5（${coach.reviewCount} 個評價）`
    : null;
  const trial = coach.trialPrice ? `🎯 試堂價：HK$${coach.trialPrice}／堂` : null;
  const regular = coach.regularPrice ? `💰 正價：HK$${coach.regularPrice}／堂` : null;
  const lines = [
    `🏅 我喺 SportsMatch 運對搵到一位${coach.sportsCategory}教練 —「${coach.name}」，分享俾你睇下！`,
    "",
    `🏷️ 運動項目：${coach.sportsCategory}`,
    `📍 授課地區：${coach.location}`,
    coach.experienceLevel ? `🎖️ 教練資歷：${coach.experienceLevel}` : null,
    rating,
    trial,
    regular,
    "",
    `👉 即睇詳細介紹、相片同學員評價：`,
    url,
    "",
    `— 由 SportsMatch 運對 提供｜香港最透明、最值得信賴的運動教練配對平台`,
  ].filter(Boolean);
  const shareText = lines.join("\n");
  const text = shareText;

  const openShare = (href: string) => {
    window.open(href, "_blank", "noopener,noreferrer,width=600,height=700");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      toast({ title: "已複製連結", description: "可以貼到任何地方分享。" });
    } catch {
      toast({ title: "複製失敗", description: "請手動選取連結複製。", variant: "destructive" });
    }
  };

  const tryNativeShare = async (e: React.MouseEvent) => {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      e.preventDefault();
      try {
        await (navigator as any).share({ title: `${coach.name} | SportsMatch 運對`, text, url });
      } catch {
        /* user cancelled */
      }
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          onClick={tryNativeShare}
          className="flex-shrink-0 p-2 rounded-full border-2 border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
          title="分享教練"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-2">
        <div className="text-xs text-muted-foreground px-2 py-1.5 font-medium">分享此教練</div>
        <div className="grid grid-cols-1 gap-1">
          <button
            type="button"
            onClick={() => openShare(`https://wa.me/?text=${encodeURIComponent(shareText)}`)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted text-sm text-left"
          >
            <span className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center text-base">💬</span>
            <span className="font-medium">WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={() => openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted text-sm text-left"
          >
            <span className="w-8 h-8 rounded-full bg-[#1877F2] text-white flex items-center justify-center">
              <Facebook className="w-4 h-4" />
            </span>
            <span className="font-medium">Facebook</span>
          </button>
          <button
            type="button"
            onClick={() => openShare(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted text-sm text-left"
          >
            <span className="w-8 h-8 rounded-full bg-[#229ED9] text-white flex items-center justify-center">
              <Send className="w-4 h-4" />
            </span>
            <span className="font-medium">Telegram</span>
          </button>
          <button
            type="button"
            onClick={() => openShare(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted text-sm text-left"
          >
            <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold">𝕏</span>
            <span className="font-medium">X (Twitter)</span>
          </button>
          <a
            href={`mailto:?subject=${encodeURIComponent(`推薦運動教練：${coach.name}`)}&body=${encodeURIComponent(shareText)}`}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted text-sm text-left"
          >
            <span className="w-8 h-8 rounded-full bg-slate-600 text-white flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </span>
            <span className="font-medium">電郵</span>
          </a>
          <div className="border-t my-1" />
          <button
            type="button"
            onClick={copyLink}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted text-sm text-left"
          >
            <span className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center">
              <Copy className="w-4 h-4" />
            </span>
            <span className="font-medium">複製連結</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

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

  const [isSaved, setIsSaved] = useState(false);
  const [savingWish, setSavingWish] = useState(false);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState<{ id: number; imageUrl: string }[]>([]);

  const [youtubeInput, setYoutubeInput] = useState("");
  const [submittingYoutube, setSubmittingYoutube] = useState(false);
  const [youtubePendingState, setYoutubePendingState] = useState<string | null | undefined>(undefined);

  type CoachPost = {
    id: number; coachId: number; caption?: string | null; mediaUrls?: string | null;
    youtubeUrl?: string | null; isApproved: boolean; isRejected: boolean;
    rejectionReason?: string | null; createdAt: string;
  };
  const [posts, setPosts] = useState<CoachPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsFetched, setPostsFetched] = useState(false);
  const [postCreateOpen, setPostCreateOpen] = useState(false);
  const [newPostCaption, setNewPostCaption] = useState("");
  const [newPostImages, setNewPostImages] = useState<string[]>([]);
  const [submittingPost, setSubmittingPost] = useState(false);

  const isOwner = !!user && !!coach && (user.id === (coach as unknown as { userId?: string }).userId);

  const coachWithYoutube = coach as unknown as { youtubeUrl?: string | null; youtubePending?: string | null } | undefined;
  const displayedYoutubeUrl = coachWithYoutube?.youtubeUrl ?? null;
  const displayedYoutubePending = youtubePendingState !== undefined ? youtubePendingState : (coachWithYoutube?.youtubePending ?? null);

  function getYoutubeEmbedId(url: string): string | null {
    try {
      const u = new URL(url);
      if (u.hostname.includes("youtu.be")) return u.pathname.slice(1).split("?")[0];
      return u.searchParams.get("v");
    } catch { return null; }
  }

  async function handleYoutubeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingYoutube(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${getBaseUrl()}/api/coaches/${id}/youtube`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ youtubeUrl: youtubeInput.trim() || null }),
      });
      if (res.ok) {
        const data = await res.json();
        setYoutubePendingState(data.youtubePending);
        setYoutubeInput("");
        toast({ title: youtubeInput.trim() ? "影片連結已提交" : "影片連結已移除", description: youtubeInput.trim() ? "管理員審核後將公開顯示，通常於 1-2 個工作天內完成。" : undefined });
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "提交失敗", description: err.error || "請稍後再試。", variant: "destructive" });
      }
    } catch {
      toast({ title: "提交時出錯", variant: "destructive" });
    }
    setSubmittingYoutube(false);
  }

  async function handleRemoveYoutubePending() {
    setSubmittingYoutube(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${getBaseUrl()}/api/coaches/${id}/youtube`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ youtubeUrl: null }),
      });
      if (res.ok) {
        setYoutubePendingState(null);
        toast({ title: "待審核連結已取消" });
      }
    } catch { toast({ title: "操作失敗", variant: "destructive" }); }
    setSubmittingYoutube(false);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploadingPhoto(true);
    try {
      const imageUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = ev => {
          const img = new Image();
          img.onload = () => {
            const MAX = 1200;
            const scale = Math.min(1, MAX / Math.max(img.width, img.height));
            const canvas = document.createElement("canvas");
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/jpeg", 0.8));
          };
          img.onerror = reject;
          img.src = ev.target!.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const token = await getAuthToken();
      const res = await fetch(`${getBaseUrl()}/api/photos/coach/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ imageUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        setPendingPhotos(prev => [...prev, { id: data.id, imageUrl }]);
        toast({ title: "相片已上傳", description: "相片將於管理員審核後公開顯示。" });
      } else {
        toast({ title: "上傳失敗", description: "請稍後再試。", variant: "destructive" });
      }
    } catch {
      toast({ title: "處理圖片時出錯", variant: "destructive" });
    }
    setUploadingPhoto(false);
  }

  useEffect(() => {
    if (!id || !user) return;
    getAuthToken().then(token => {
      if (!token) return;
      fetch(`${getBaseUrl()}/api/wishlist/check/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()).then(d => setIsSaved(!!d.saved));
    });
  }, [id, user]);

  async function fetchPosts() {
    if (!id || postsLoading) return;
    setPostsLoading(true);
    try {
      const token = await getAuthToken();
      const url = isOwner && token
        ? `${getBaseUrl()}/api/posts/coach/${id}/my`
        : `${getBaseUrl()}/api/posts/coach/${id}`;
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(url, { headers });
      if (res.ok) setPosts(await res.json());
    } catch { /* silent */ }
    setPostsLoading(false);
    setPostsFetched(true);
  }

  async function handlePostImageAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || newPostImages.length >= 3) return;
    e.target.value = "";
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = ev => {
        const img = new Image();
        img.onload = () => {
          const MAX = 1200;
          const scale = Math.min(1, MAX / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.onerror = reject;
        img.src = ev.target!.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    setNewPostImages(prev => [...prev, dataUrl]);
  }

  async function handleCreatePost() {
    if (!newPostCaption.trim() && newPostImages.length === 0) return;
    setSubmittingPost(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${getBaseUrl()}/api/posts/coach/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ caption: newPostCaption.trim() || null, mediaUrls: newPostImages }),
      });
      if (res.ok) {
        const newPost = await res.json();
        setPosts(prev => [newPost, ...prev]);
        setNewPostCaption("");
        setNewPostImages([]);
        setPostCreateOpen(false);
        toast({ title: "動向已發布", description: "管理員審核後將公開顯示，通常於 1-2 個工作天內完成。" });
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "發布失敗", description: err.error || "請稍後再試。", variant: "destructive" });
      }
    } catch {
      toast({ title: "發布時出錯", variant: "destructive" });
    }
    setSubmittingPost(false);
  }

  async function handleDeletePost(postId: number) {
    const token = await getAuthToken();
    const res = await fetch(`${getBaseUrl()}/api/posts/${postId}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setPosts(prev => prev.filter(p => p.id !== postId));
      toast({ title: "動向已刪除" });
    }
  }

  async function toggleWishlist() {
    if (!user) return;
    setSavingWish(true);
    const token = await getAuthToken();
    if (isSaved) {
      await fetch(`${getBaseUrl()}/api/wishlist/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      setIsSaved(false);
    } else {
      await fetch(`${getBaseUrl()}/api/wishlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ coachId: id }),
      });
      setIsSaved(true);
    }
    setSavingWish(false);
  }

  async function submitReport() {
    if (!reportReason) return;
    setSubmittingReport(true);
    const token = await getAuthToken();
    await fetch(`${getBaseUrl()}/api/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ coachId: id, reason: reportReason, description: reportDesc }),
    });
    setSubmittingReport(false);
    setReportOpen(false);
    setReportReason("");
    setReportDesc("");
    toast({ title: "舉報已提交", description: "我哋會盡快跟進處理，感謝你的反饋。" });
  }

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
      <div className="bg-slate-50 dark:bg-background pb-12 pt-8 md:pt-10 flex-1">
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start">
            
            {/* Left Column: Profile Info */}
            <div className="flex-1 w-full space-y-6">
              <div className="bg-white dark:bg-card rounded-2xl p-6 md:p-8 shadow-sm border flex flex-col md:flex-row gap-6 items-start">
                <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-white shadow-md bg-white">
                  <AvatarImage src={coach.profileImageUrl || undefined} alt={coach.name} className="object-cover" />
                  <AvatarFallback className="text-4xl font-bold bg-primary/10 text-primary">{coach.name.charAt(0)}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl md:text-4xl font-display font-bold">
                      {coach.name}
                    </h1>
                    <Show when="signed-in">
                      <button
                        onClick={toggleWishlist}
                        disabled={savingWish}
                        className={`flex-shrink-0 p-2 rounded-full border-2 transition-all ${isSaved ? "bg-red-50 border-red-300 text-red-500 hover:bg-red-100" : "border-border text-muted-foreground hover:border-red-300 hover:text-red-400"}`}
                        title={isSaved ? "從收藏移除" : "儲存教練"}
                      >
                        <Heart className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
                      </button>
                    </Show>
                    <ShareCoachButton coach={coach} />
                  </div>

                  <div className="inline-flex items-center px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xl md:text-2xl font-display font-bold">
                    {coach.sportsCategory}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {coach.isApproved && (
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 gap-1">
                        <CheckCircle2 className="w-3 h-3" /> 已認證
                      </Badge>
                    )}
                    {coach.reviewCount >= 5 && (
                      <Badge variant="outline" className="text-primary border-orange-200 bg-orange-50 gap-1">
                        <ThumbsUp className="w-3 h-3" /> 多人讚好
                      </Badge>
                    )}
                  </div>
                  
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
                <div className="relative overflow-x-auto border-b mb-6">
                  <TabsList className="flex w-max min-w-full justify-start rounded-none h-auto p-0 bg-transparent">
                    <TabsTrigger value="about" className="flex-shrink-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 px-5 text-sm sm:text-base font-medium">關於教練</TabsTrigger>
                    <TabsTrigger value="posts" onClick={() => { if (!postsFetched) fetchPosts(); }} className="flex-shrink-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 px-5 text-sm sm:text-base font-medium flex items-center gap-1.5">
                      <Newspaper className="w-4 h-4" /> 最新動向
                    </TabsTrigger>
                    <TabsTrigger value="photos" className="flex-shrink-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 px-5 text-sm sm:text-base font-medium">相片</TabsTrigger>
                    <TabsTrigger value="video" className="flex-shrink-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 px-5 text-sm sm:text-base font-medium flex items-center gap-1.5">
                      <Youtube className="w-4 h-4" /> 影片
                      {displayedYoutubeUrl && <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />}
                    </TabsTrigger>
                    <TabsTrigger value="reviews" className="flex-shrink-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 px-5 text-sm sm:text-base font-medium">學員評價</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="about" className="space-y-6 animate-in fade-in-50">
                  <div className="bg-white dark:bg-card rounded-2xl p-6 md:p-8 shadow-sm border">
                    <h3 className="text-xl font-bold font-display mb-4">關於此教練</h3>
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">{coach.bio}</p>
                    </div>

                    {/* Credential sections */}
                    {(() => {
                      const isPro = coach.experienceLevel?.includes("專業運動員");
                      const isCert = coach.experienceLevel?.includes("持牌教練");
                      let quals: { text: string; proofUrl?: string }[] = [];
                      try { quals = coach.qualifications ? JSON.parse(coach.qualifications as unknown as string) : []; } catch {}
                      const proQuals = quals.filter(q => q.text?.trim());

                      return (
                        <>
                          {isPro && (
                            <div className="mt-6 pt-6 border-t">
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <Award className="w-4 h-4 text-primary" />
                                專業運動員
                              </h4>
                              <div className="space-y-2">
                                <div className="flex items-start gap-2 text-sm">
                                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                  <span>{coach.sportsCategory} 代表級運動員背景</span>
                                </div>
                                {proQuals.map((q, i) => (
                                  <div key={i} className="flex items-start gap-2 text-sm">
                                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                    <span>{q.text}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {isCert && (
                            <div className="mt-6 pt-6 border-t">
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-primary" />
                                持證書教練
                              </h4>
                              <div className="space-y-2">
                                {proQuals.length > 0 ? proQuals.map((q, i) => (
                                  <div key={i} className="flex items-start gap-2 text-sm">
                                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                    <span>{q.text}</span>
                                  </div>
                                )) : (
                                  <div className="flex items-start gap-2 text-sm">
                                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                    <span>持認可 {coach.sportsCategory} 教練資格</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}

                    {coach.teachingAchievements?.trim() && (
                      <div className="mt-6 pt-6 border-t">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Award className="w-4 h-4 text-primary" />
                          教學成就或經驗
                        </h4>
                        <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed text-sm">
                          {coach.teachingAchievements}
                        </p>
                      </div>
                    )}

                    {coach.sportsAchievements?.trim() && (
                      <div className="mt-6 pt-6 border-t">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-primary" />
                          運動成就
                        </h4>
                        <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed text-sm">
                          {coach.sportsAchievements}
                        </p>
                      </div>
                    )}

                    {((coach as any).teachingFocus?.length ?? 0) > 0 && (
                      <div className="mt-8 pt-8 border-t">
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">教學類型</h4>
                        <div className="flex flex-wrap gap-2">
                          {(coach as any).teachingFocus.map((focus: string) => (
                            <Badge key={focus} className="bg-primary/10 text-primary border-primary/30 hover:bg-primary/15">
                              {focus === "競賽" ? "🏆 " : "🎯 "}{focus}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-8 pt-8 border-t">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">適合年齡組別</h4>
                      <div className="flex flex-wrap gap-2">
                        {coach.ageGroups.map(age => (
                          <Badge key={age} variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">{age}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="posts" className="animate-in fade-in-50">
                  <div className="bg-white dark:bg-card rounded-2xl p-6 md:p-8 shadow-sm border space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold font-display flex items-center gap-2">
                        <Newspaper className="w-5 h-5 text-primary" /> 最新動向
                      </h3>
                      {isOwner && (
                        <Button size="sm" onClick={() => setPostCreateOpen(true)} className="gap-1.5">
                          <PlusCircle className="w-4 h-4" /> 發布動向
                        </Button>
                      )}
                    </div>

                    {postsLoading ? (
                      <div className="space-y-4">
                        {[1, 2].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
                      </div>
                    ) : posts.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed">
                        {isOwner ? (
                          <div className="space-y-2">
                            <Newspaper className="w-8 h-8 mx-auto text-muted-foreground/50" />
                            <p>尚未發布任何動向</p>
                            <p className="text-xs">點擊「發布動向」按鈕，分享你的訓練日常吧！</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Newspaper className="w-8 h-8 mx-auto text-muted-foreground/50" />
                            <p>此教練尚未發布任何動向</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {posts.map(post => {
                          const images: string[] = (() => { try { return post.mediaUrls ? JSON.parse(post.mediaUrls) : []; } catch { return []; } })();
                          const isPending = !post.isApproved && !post.isRejected;
                          const isRejected = post.isRejected;
                          return (
                            <div key={post.id} className={`rounded-xl border overflow-hidden ${isPending ? "opacity-80" : isRejected ? "opacity-60" : ""}`}>
                              {images.length > 0 && (
                                <div className={`grid gap-1 ${images.length === 1 ? "grid-cols-1" : images.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                                  {images.map((src, i) => (
                                    <div key={i} className={`overflow-hidden bg-slate-100 ${images.length === 1 ? "aspect-[4/3]" : "aspect-square"}`}>
                                      <img src={src} alt={`動向圖片 ${i + 1}`} className="w-full h-full object-cover" />
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="p-4 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(post.createdAt).toLocaleDateString("zh-HK", { year: "numeric", month: "long", day: "numeric" })}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {isOwner && isPending && (
                                      <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 gap-1">
                                        <Clock className="w-3 h-3" /> 審核中
                                      </Badge>
                                    )}
                                    {isOwner && isRejected && (
                                      <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">已拒絕</Badge>
                                    )}
                                    {isOwner && (
                                      <button onClick={() => handleDeletePost(post.id)} className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors" title="刪除">
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                {post.caption && (
                                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.caption}</p>
                                )}
                                {isOwner && isRejected && post.rejectionReason && (
                                  <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">拒絕原因：{post.rejectionReason}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {isOwner && (
                      <p className="text-xs text-muted-foreground bg-orange-50 border border-orange-100 rounded-lg px-4 py-3">
                        💡 動向經管理員審核後才會公開顯示，通常於 1-2 個工作天內完成。
                      </p>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="photos" className="animate-in fade-in-50">
                  <div className="bg-white dark:bg-card rounded-2xl p-6 md:p-8 shadow-sm border space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold font-display flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-primary" /> 訓練相片
                      </h3>
                      {isOwner && (
                        <label className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border cursor-pointer transition-all ${
                          uploadingPhoto
                            ? "border-primary/30 text-primary/50 bg-primary/5 cursor-not-allowed"
                            : "border-primary text-primary hover:bg-primary/5"
                        }`}>
                          {uploadingPhoto
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> 上傳中…</>
                            : <><Upload className="w-4 h-4" /> 上傳相片</>
                          }
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingPhoto}
                            onChange={handlePhotoUpload}
                          />
                        </label>
                      )}
                    </div>

                    {/* Pending photos — visible only to owner */}
                    {isOwner && pendingPhotos.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> 等候審核中
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {pendingPhotos.map(photo => (
                            <div key={photo.id} className="aspect-square rounded-xl overflow-hidden border relative">
                              <img src={photo.imageUrl} alt="Pending" className="w-full h-full object-cover opacity-60" />
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/30">
                                <Clock className="w-5 h-5 text-white" />
                                <span className="text-white text-xs font-medium">待審核</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Approved photos */}
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
                    ) : pendingPhotos.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed">
                        {isOwner ? (
                          <div className="space-y-2">
                            <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground/50" />
                            <p>暫未上傳相片</p>
                            <p className="text-xs">點擊右上角「上傳相片」按鈕添加你的訓練照片</p>
                          </div>
                        ) : "暫未上傳相片。"}
                      </div>
                    ) : null}

                    {isOwner && (
                      <p className="text-xs text-muted-foreground bg-orange-50 border border-orange-100 rounded-lg px-4 py-3">
                        💡 相片經管理員審核後才會公開顯示，通常於 1-2 個工作天內完成。
                      </p>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="video" className="animate-in fade-in-50">
                  <div className="bg-white dark:bg-card rounded-2xl p-6 md:p-8 shadow-sm border space-y-6">
                    <h3 className="text-xl font-bold font-display flex items-center gap-2">
                      <Youtube className="w-5 h-5 text-red-500" /> 教練影片
                    </h3>

                    {/* Public: show approved YouTube embed */}
                    {displayedYoutubeUrl && (() => {
                      const embedId = getYoutubeEmbedId(displayedYoutubeUrl);
                      return embedId ? (
                        <div className="rounded-xl overflow-hidden border aspect-video">
                          <iframe
                            className="w-full h-full"
                            src={`https://www.youtube.com/embed/${embedId}`}
                            title="教練影片"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : null;
                    })()}

                    {/* Owner: pending notice */}
                    {isOwner && displayedYoutubePending && (
                      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <Clock className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-amber-800 text-sm">待審核影片連結</p>
                          <p className="text-amber-700 text-xs mt-0.5 truncate">{displayedYoutubePending}</p>
                          <p className="text-amber-600 text-xs mt-1">管理員審核後將公開顯示，通常於 1-2 個工作天內完成。</p>
                        </div>
                        <button
                          onClick={handleRemoveYoutubePending}
                          disabled={submittingYoutube}
                          className="shrink-0 p-1 rounded hover:bg-amber-100 text-amber-600 transition-colors"
                          title="取消待審核連結"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Owner: submission form */}
                    {isOwner && (
                      <form onSubmit={handleYoutubeSubmit} className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border">
                        <h4 className="font-semibold text-sm">
                          {displayedYoutubePending ? "更換影片連結" : displayedYoutubeUrl ? "更換已批准影片" : "提交 YouTube 影片連結"}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          貼上你的 YouTube 影片連結（例如：https://www.youtube.com/watch?v=…）
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={youtubeInput}
                            onChange={e => setYoutubeInput(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="flex-1 rounded-lg border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                          <Button type="submit" disabled={submittingYoutube || !youtubeInput.trim()} size="sm">
                            {submittingYoutube ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            <span className="ml-1.5">提交</span>
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
                          💡 影片連結經管理員審核後才會公開顯示，每位教練只可提交一條影片連結。
                        </p>
                      </form>
                    )}

                    {/* No video state for public */}
                    {!displayedYoutubeUrl && !isOwner && (
                      <div className="text-center py-12 text-muted-foreground bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed">
                        <Youtube className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                        <p>此教練暫未上傳影片。</p>
                      </div>
                    )}

                    {/* No video state for owner who hasn't submitted yet */}
                    {!displayedYoutubeUrl && !displayedYoutubePending && isOwner && (
                      <div className="text-center py-6 text-muted-foreground bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed">
                        <Youtube className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                        <p className="text-sm">在上方提交你的 YouTube 影片連結，讓學員更了解你的教學風格！</p>
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
            <div className="w-full md:w-80 lg:w-96 shrink-0 md:sticky md:top-24 flex flex-col gap-4">
              <Card className="border-primary/20 shadow-lg overflow-hidden">
                <div className="bg-primary/5 p-4 border-b text-center">
                  <span className="font-display font-bold text-primary tracking-wide">明碼實價</span>
                </div>
                <CardContent className="p-5 space-y-4">
                  {(() => {
                    type PlanRow = { sessionType: string; price: string; minStudents?: string; maxStudents: string; duration: string; ageGroup?: string };
                    let plans: PlanRow[] | null = null;
                    try { if ((coach as any).pricingPlans) plans = JSON.parse((coach as any).pricingPlans); } catch {}

                    if (plans && plans.length > 0) {
                      return (
                        <div className="space-y-2">
                          {plans.map((row, i) => {
                            const isSolo = row.sessionType === "單對單";
                            const headcount = isSolo
                              ? "1 人"
                              : row.minStudents && row.maxStudents
                                ? `${row.minStudents}–${row.maxStudents} 人`
                                : row.maxStudents
                                  ? `最多 ${row.maxStudents} 人`
                                  : "小組";
                            const ageLabel = row.ageGroup ? row.ageGroup.replace(/（[^）]*）/, "") : "所有年齡";
                            return (
                              <div
                                key={i}
                                className={`rounded-xl border p-3 ${isSolo ? "bg-primary/5 border-primary/20" : "bg-amber-50/60 border-amber-200"}`}
                              >
                                <div className="flex items-center justify-between gap-3 mb-2">
                                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${isSolo ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-800"}`}>
                                    {isSolo ? "👤" : "👥"} {row.sessionType}
                                  </span>
                                  <span className="font-display font-bold text-primary text-xl whitespace-nowrap">
                                    ${row.price}
                                    <span className="text-xs font-normal text-muted-foreground ml-1">/堂</span>
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                  <span>👥 {headcount}</span>
                                  {row.duration && <span>⏱ {row.duration}</span>}
                                  <span>🎯 {ageLabel}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }

                    const hasDiscount = Number(coach.trialPrice) < Number(coach.regularPrice);
                    return (
                      <>
                        {hasDiscount && (
                          <>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-sm font-medium text-muted-foreground">
                                <span>體驗堂</span>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">首次優惠</Badge>
                              </div>
                              <div className="text-4xl font-display font-bold text-foreground">${coach.trialPrice}</div>
                            </div>
                            <div className="w-full h-px bg-border" />
                          </>
                        )}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm font-medium text-muted-foreground">
                            <span>正課</span><span>每小時</span>
                          </div>
                          <div className="text-3xl font-display font-bold text-foreground">${coach.regularPrice}</div>
                        </div>
                      </>
                    );
                  })()}

                  {coach.packageDetails && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                      <p className="text-xs font-semibold text-primary mb-1">其他收費模式</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{coach.packageDetails}</p>
                    </div>
                  )}

                  <div className="pt-2 space-y-3">
                    {coach.whatsappNumber ? (
                      <a
                        href={`https://wa.me/${coach.whatsappNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <Button className="w-full text-lg h-12 rounded-xl font-bold bg-[#25D366] hover:bg-[#1ebe5d] text-white" size="lg">
                          <Phone className="w-5 h-5 mr-2" />
                          WhatsApp 聯絡教練
                        </Button>
                      </a>
                    ) : (
                      <Button className="w-full text-lg h-12 rounded-xl font-bold" size="lg" disabled>
                        <Phone className="w-5 h-5 mr-2" />
                        聯絡方式待更新
                      </Button>
                    )}
                    {((coach as any).facebookUrl || (coach as any).instagramUrl) && (
                      <div className="flex items-center justify-center gap-3 pt-1">
                        {(coach as any).facebookUrl && (
                          <a
                            href={(coach as any).facebookUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Facebook"
                            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#1877F2] hover:bg-[#0e63cf] text-white transition-colors"
                          >
                            <Facebook className="w-5 h-5" />
                          </a>
                        )}
                        {(coach as any).instagramUrl && (
                          <a
                            href={(coach as any).instagramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Instagram"
                            className="inline-flex items-center justify-center w-10 h-10 rounded-full text-white transition-opacity hover:opacity-90"
                            style={{ background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)" }}
                          >
                            <Instagram className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                    )}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                      <p className="text-xs text-amber-800 text-center leading-relaxed">
                        💡 所有費用直接支付予教練，本平台不收取任何課堂費用。
                      </p>
                    </div>
                    <Show when="signed-in">
                      <button
                        onClick={() => setReportOpen(true)}
                        className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors py-1"
                      >
                        <Flag className="w-3 h-3" /> 舉報此教練
                      </button>
                    </Show>
                  </div>

                </CardContent>
              </Card>

            </div>
            
          </div>
        </div>
      </div>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-destructive" /> 舉報教練
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-sm text-muted-foreground mb-2">請選擇舉報原因：</p>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇原因…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fake_profile">虛假或誤導性資料</SelectItem>
                  <SelectItem value="inappropriate">不當行為或言論</SelectItem>
                  <SelectItem value="scam">疑似詐騙</SelectItem>
                  <SelectItem value="wrong_info">資料錯誤（地址/聯絡方式）</SelectItem>
                  <SelectItem value="other">其他原因</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">詳細說明（選填）：</p>
              <Textarea
                value={reportDesc}
                onChange={e => setReportDesc(e.target.value)}
                placeholder="請提供更多資料幫助我哋調查…"
                rows={3}
                className="resize-none"
              />
            </div>
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              🔒 你的身份將保密，舉報會由運對團隊跟進。嚴重個案可能導致教練帳戶被停用。
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReportOpen(false)}>取消</Button>
            <Button
              variant="destructive"
              onClick={submitReport}
              disabled={!reportReason || submittingReport}
            >
              {submittingReport ? "提交中…" : "提交舉報"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Post Dialog */}
      <Dialog open={postCreateOpen} onOpenChange={open => { setPostCreateOpen(open); if (!open) { setNewPostCaption(""); setNewPostImages([]); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-primary" /> 發布最新動向
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Textarea
              value={newPostCaption}
              onChange={e => setNewPostCaption(e.target.value)}
              placeholder="分享你的訓練日常、心得或公告…"
              rows={4}
              className="resize-none"
            />
            {/* Image previews */}
            {newPostImages.length > 0 && (
              <div className={`grid gap-2 ${newPostImages.length === 1 ? "grid-cols-1" : newPostImages.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {newPostImages.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border bg-slate-100 group">
                    <img src={src} alt={`預覽 ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => setNewPostImages(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {newPostImages.length < 3 && (
              <label className="flex items-center gap-2 cursor-pointer text-sm text-primary hover:underline w-fit">
                <ImagePlus className="w-4 h-4" />
                新增相片（最多 3 張）
                <input type="file" accept="image/*" className="hidden" onChange={handlePostImageAdd} />
              </label>
            )}
            <p className="text-xs text-muted-foreground bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
              💡 動向經管理員審核後才會公開顯示，通常於 1-2 個工作天內完成。
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPostCreateOpen(false)}>取消</Button>
            <Button
              onClick={handleCreatePost}
              disabled={(!newPostCaption.trim() && newPostImages.length === 0) || submittingPost}
            >
              {submittingPost ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 發布中…</> : "發布動向"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
