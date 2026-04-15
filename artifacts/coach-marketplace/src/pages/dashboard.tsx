import { Layout } from "@/components/layout";
import { useUser } from "@clerk/react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, Star, MapPin, MessageCircle, Zap, Trophy, Target } from "lucide-react";
import { getBaseUrl } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-token";

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

const goalLabels: Record<string, string> = {
  weight_loss: "💪 減重塑形", muscle_gain: "🏋️ 增肌強壯", competition: "🏆 備戰比賽",
  fitness: "❤️ 提升健康", skill: "🎯 學習技術", fun: "🎉 興趣娛樂", rehab: "🌿 康復調理",
};

const availabilityLabels: Record<string, string> = {
  weekday_morning: "☀️ 平日早上", weekday_afternoon: "🌤 平日下午", weekday_evening: "🌙 平日晚上",
  weekend_morning: "🌅 週末早上", weekend_afternoon: "🏖 週末下午", weekend_evening: "🌆 週末晚上",
};

export default function Dashboard() {
  const { user } = useUser();
  const [savedCoaches, setSavedCoaches] = useState<SavedCoach[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recommendedCoaches, setRecommendedCoaches] = useState<SavedCoach[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = await getAuthToken();
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
  }, []);

  async function removeFromWishlist(coachId: number) {
    const token = await getAuthToken();
    await fetch(`${getBaseUrl()}/api/wishlist/${coachId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setSavedCoaches(prev => prev.filter(c => c.id !== coachId));
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

        {profile && (profile.goals?.length > 0 || profile.preferredSports?.length > 0) && (
          <Card className="mb-8 bg-gradient-to-r from-yellow-50 to-amber-50 border-primary/30">
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
    </Layout>
  );
}
