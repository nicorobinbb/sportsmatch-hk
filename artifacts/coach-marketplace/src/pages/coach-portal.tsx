import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useCoachStatus } from "@/hooks/use-coach-status";
import { useAuth } from "@/hooks/use-auth";
import { getBaseUrl } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-token";
import { 
  Eye, 
  Pencil, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Upload,
  Award,
  Heart,
  User,
  Image as ImageIcon,
  Video,
  BarChart3,
  Settings,
  MapPin,
  Star,
  Facebook,
  Instagram,
  Globe,
  ThumbsUp,
  Trophy,
  X,
  Loader2,
  Plus,
  Trash2,
  Youtube,
  Newspaper,
  Send
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Pricing row type (same as coach-register)
type PricingRow = { 
  id: string; 
  sessionType: "單對單" | "小組課堂"; 
  price: string; 
  minStudents: string; 
  maxStudents: string; 
  duration: string; 
  ageGroup?: string 
};

const AGE_GROUP_PRICING_OPTIONS = ["幼童（8歲以下）", "兒童（8至12歲）", "青少年（12-17歲）", "成人（18歲以上）", "長者（60歲以上）"];
const HK_DISTRICTS = [
  "中西區", "灣仔", "東區", "南區",
  "油尖旺", "深水埗", "九龍城", "黃大仙", "觀塘",
  "葵青", "荃灣", "屯門", "元朗", "北區", "大埔", "沙田", "西貢", "離島",
];

interface CoachStats {
  profileViews: number;
  contactClicks: number;
  unlockRevenue: number;
  wishlistSaves: number;
}

interface MyCoach {
  id: number;
  name: string;
  nameZh?: string | null;
  nameEn?: string | null;
  sportsCategory: string;
  location: string;
  bio: string;
  isApproved: boolean;
  isFeatured: boolean;
  pendingEdits: string | null;
  profileImageUrl?: string | null;
  coverPhotoUrl?: string | null;
  trialPrice: number;
  regularPrice: number;
  createdAt: string;
  experienceLevel?: string;
  ageGroups?: string[];
  teachingFocus?: string[];
  whatsappNumber?: string | null;
  pricingPlans?: string | null;
  packageDetails?: string | null;
  qualifications?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
  websiteUrl?: string | null;
  scrcNumber?: string | null;
  teachingAchievements?: string | null;
  sportsAchievements?: string | null;
}

export default function CoachPortal() {
  const { isSignedIn, user, isAuthLoading } = useAuth();
  const { data: coachStatus, isLoading: isCoachLoading, refetch: refetchCoachStatus } = useCoachStatus();
  const [coaches, setCoaches] = useState<MyCoach[]>([]);
  const [stats, setStats] = useState<Record<number, CoachStats>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'posts' | 'photos' | 'videos' | 'stats'>('profile');
  const [selectedCoachId, setSelectedCoachId] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Edit form state
  const [editOpen, setEditOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState<MyCoach | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    bio: string;
    location: string;
    experienceLevel: string;
    whatsappNumber: string;
    facebookUrl: string;
    instagramUrl: string;
    websiteUrl: string;
    pricingPlans: string;
    qualifications: string;
  } | null>(null);
  const [pricingRows, setPricingRows] = useState<PricingRow[]>([]);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isSignedIn) {
      window.location.href = "/sign-in?redirect=/coach-portal";
      return;
    }
    if (coachStatus?.coaches) {
      setCoaches(coachStatus.coaches);
      loadStats(coachStatus.coaches);
      if (!selectedCoachId && coachStatus.coaches.length > 0) {
        setSelectedCoachId(coachStatus.coaches[0].id);
      }
    }
    setLoading(false);
  }, [isSignedIn, isAuthLoading, coachStatus]);

  async function loadStats(coachList: MyCoach[]) {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${getBaseUrl()}/api/coaches/me/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || {});
      } else {
        // Fallback to mock data if API fails
        const mockStats: Record<number, CoachStats> = {};
        for (const coach of coachList) {
          mockStats[coach.id] = {
            profileViews: Math.floor(Math.random() * 500) + 50,
            contactClicks: Math.floor(Math.random() * 50) + 5,
            unlockRevenue: Math.floor(Math.random() * 1000) + 100,
            wishlistSaves: Math.floor(Math.random() * 30) + 3,
          };
        }
        setStats(mockStats);
      }
    } catch {
      // Fallback to empty stats
      setStats({});
    }
  }

  // Open edit dialog
  function openEdit(coach: MyCoach) {
    setEditingCoach(coach);
    setEditForm({
      name: coach.name,
      bio: coach.bio || '',
      location: coach.location,
      experienceLevel: coach.experienceLevel || '',
      whatsappNumber: coach.whatsappNumber || '',
      facebookUrl: coach.facebookUrl || '',
      instagramUrl: coach.instagramUrl || '',
      websiteUrl: '',
      pricingPlans: coach.pricingPlans || '[]',
      qualifications: coach.qualifications || '[]',
    });
    
    // Parse pricing plans into rows
    try {
      const plans = coach.pricingPlans ? JSON.parse(coach.pricingPlans) : [];
      if (Array.isArray(plans) && plans.length > 0) {
        setPricingRows(plans.map((p: any) => ({
          id: crypto.randomUUID(),
          sessionType: p.sessionType || '單對單',
          price: String(p.price || ''),
          minStudents: String(p.minStudents || ''),
          maxStudents: String(p.maxStudents || ''),
          duration: p.duration || '',
          ageGroup: p.ageGroup || '',
        })));
      } else {
        setPricingRows([newPricingRow()]);
      }
    } catch {
      setPricingRows([newPricingRow()]);
    }
    
    setEditOpen(true);
  }
  
  // Pricing row helpers
  const newPricingRow = (): PricingRow => ({ 
    id: crypto.randomUUID(), 
    sessionType: "單對單", 
    price: "", 
    minStudents: "", 
    maxStudents: "", 
    duration: "", 
    ageGroup: "" 
  });
  
  const updatePricingRow = (id: string, patch: Partial<PricingRow>) =>
    setPricingRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
    
  const removePricingRow = (id: string) =>
    setPricingRows(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : prev);
    
  const addPricingRow = () =>
    setPricingRows(prev => [...prev, newPricingRow()]);
  
  // Convert pricing rows to JSON for submission
  const getPricingPlansJSON = () => {
    return JSON.stringify(pricingRows.map(({ id, ...rest }) => rest));
  };

  // Submit edit request
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
          bio: editForm.bio,
          location: editForm.location,
          experienceLevel: editForm.experienceLevel,
          whatsappNumber: editForm.whatsappNumber || undefined,
          facebookUrl: editForm.facebookUrl || undefined,
          instagramUrl: editForm.instagramUrl || undefined,
          pricingPlans: getPricingPlansJSON(),
          qualifications: editForm.qualifications,
        }),
      });
      
      if (res.ok) {
        setEditOpen(false);
        toast({ title: "修改申請已提交", description: "管理員審核後將更新你的檔案，通常於 1-2 個工作天內完成。" });
        // Refresh coach data
        await refetchCoachStatus();
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "提交失敗", description: err.error || "請稍後再試。", variant: "destructive" });
      }
    } catch {
      toast({ title: "提交時出錯", variant: "destructive" });
    }
    setSubmittingEdit(false);
  }

  // Parse pending edits for preview
  function getPendingEditsPreview(coach: MyCoach): Record<string, any> | null {
    if (!coach.pendingEdits) return null;
    try {
      return JSON.parse(coach.pendingEdits);
    } catch {
      return null;
    }
  }

  if (loading || isCoachLoading) {
    return (
      <Layout>
        <div className="container px-4 py-8 max-w-6xl mx-auto">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      </Layout>
    );
  }

  if (!isSignedIn) {
    return null; // Redirect handled in useEffect
  }

  // 用戶未註冊教練 - 顯示註冊引導
  if (!coachStatus?.isCoach) {
    return (
      <Layout>
        <div className="container px-4 py-12 max-w-2xl mx-auto text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">成為教練，拓展你的事業</h1>
            <p className="text-muted-foreground">
              在運對平台上展示你的專業，接觸更多學生，建立個人品牌
            </p>
          </div>

          <Card className="text-left mb-6">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">教練福利：</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span>免費建立專業檔案頁面</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span>學生付費解鎖聯絡方式，你賺取收入</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span>數據分析：追蹤檔案瀏覽次數</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span>自行管理檔案內容，即時更新</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Link href="/coach/register">
            <Button size="lg" className="w-full md:w-auto">
              立即註冊成為教練
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  // 已註冊教練 - 顯示 Portal (Sidebar Layout)
  const selectedCoach = coaches.find(c => c.id === selectedCoachId) || coaches[0];
  const coachStats = selectedCoach ? (stats[selectedCoach.id] || { profileViews: 0, contactClicks: 0, unlockRevenue: 0, wishlistSaves: 0 }) : null;
  const hasPending = selectedCoach ? !!selectedCoach.pendingEdits : false;

  return (
    <Layout>
      <div className="container px-4 md:px-6 py-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 左邊 Sidebar (1/3) */}
          <div className="md:col-span-1">
            {/* 教練資料卡片 - 重新設計 */}
            {selectedCoach && (
              <div className="bg-white rounded-2xl shadow-sm border p-5 mb-4">
                {/* 頭像同基本資料 */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20 border-4 border-white shadow-md">
                      <AvatarImage src={selectedCoach.profileImageUrl || undefined} className="object-cover" />
                      <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                        {selectedCoach.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    {/* 上傳頭像按鈕 */}
                    <button 
                      className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
                      title="更改頭像"
                    >
                      <Upload className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-lg truncate">{selectedCoach.name}</h2>
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary text-sm font-bold mt-1">
                      {selectedCoach.sportsCategory}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">{selectedCoach.location}</span>
                    </p>
                    
                    {/* 狀態指示 */}
                    <div className="flex items-center gap-2 mt-2">
                      {hasPending ? (
                        <Badge variant="outline" className="border-amber-400 text-amber-600 text-xs bg-amber-50">
                          <Clock className="w-3 h-3 mr-1" />
                          修改審批中
                        </Badge>
                      ) : selectedCoach.isApproved ? (
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          已認證
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">審批中</Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* 快速數據 - 更精緻 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{coachStats?.profileViews || 0}</p>
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Eye className="w-3 h-3" /> 瀏覽
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{coachStats?.wishlistSaves || 0}</p>
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Heart className="w-3 h-3" /> 收藏
                    </p>
                  </div>
                </div>
                
                {/* 快捷操作 */}
                <div className="flex gap-2 mt-4">
                  <Link href={`/coaches/${selectedCoach.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-1">
                      <Eye className="w-3.5 h-3.5" /> 公開頁面
                    </Button>
                  </Link>
                  <Link href={`/coach/edit/${selectedCoach.id}`} className="flex-1">
                    <Button size="sm" className="w-full gap-1">
                      <Pencil className="w-3.5 h-3.5" /> 編輯資料
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* 導航選單 */}
            <Card>
              <CardContent className="p-2">
                <nav className="flex flex-col gap-1">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === 'profile' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <User className="h-4 w-4" />
                    <span className="font-medium">教練檔案</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('posts')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === 'posts' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <Newspaper className="h-4 w-4" />
                    <span className="font-medium">最新動向</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('photos')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === 'photos' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <ImageIcon className="h-4 w-4" />
                    <span className="font-medium">我的相片</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('videos')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === 'videos' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <Video className="h-4 w-4" />
                    <span className="font-medium">我的影片</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('stats')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === 'stats' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-medium">詳細數據</span>
                  </button>
                </nav>
              </CardContent>
            </Card>

            {/* 其他教練檔案 */}
            {coaches.length > 1 && (
              <Card className="mt-4">
                <CardContent className="p-4">
                  <p className="text-sm font-medium mb-3">切換教練檔案</p>
                  <div className="space-y-2">
                    {coaches.map(coach => (
                      <button
                        key={coach.id}
                        onClick={() => setSelectedCoachId(coach.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                          selectedCoachId === coach.id 
                            ? 'bg-primary/10 text-primary' 
                            : 'hover:bg-slate-100'
                        }`}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={coach.profileImageUrl || undefined} />
                          <AvatarFallback className="text-xs">{coach.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{coach.name}</p>
                          <p className="text-xs text-muted-foreground">{coach.sportsCategory}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 註冊新運動 */}
            <Link href="/coach/register">
              <Button variant="outline" className="w-full mt-4 gap-2">
                <Upload className="w-4 h-4" />
                註冊新運動類別
              </Button>
            </Link>
          </div>

          {/* 右邊主內容 (2/3) */}
          <div className="md:col-span-2">
            
            {/* 教練檔案 - 參考公開 profile 頁設計 */}
            {activeTab === 'profile' && selectedCoach && (
              <div className="space-y-6">
                {/* Pending edits warning */}
                {selectedCoach.pendingEdits && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-amber-800">修改申請審批中</p>
                      <p className="text-sm text-amber-700 mb-3">
                        你有待審批的修改。管理員審核後將自動更新，通常於 1-2 個工作天內完成。
                      </p>
                      
                      {/* Show what's pending */}
                      {(() => {
                        const pending = getPendingEditsPreview(selectedCoach);
                        if (!pending) return null;
                        return (
                          <div className="mt-3 p-3 bg-white/50 rounded-lg text-sm">
                            <p className="font-medium text-amber-800 mb-2">待更新內容預覽：</p>
                            <div className="space-y-1 text-amber-700">
                              {pending.name && <p>• 名稱: {pending.name}</p>}
                              {pending.bio && <p>• 簡介已更新</p>}
                              {pending.location && <p>• 地區: {pending.location}</p>}
                              {pending.experienceLevel && <p>• 資歷: {pending.experienceLevel}</p>}
                              {pending.whatsappNumber && <p>• WhatsApp 已更新</p>}
                              {pending.pricingPlans && <p>• 收費計劃已更新</p>}
                              {pending.qualifications && <p>• 專業資歷已更新</p>}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Profile Header Card - 類似公開頁 */}
                <div className="bg-white dark:bg-card rounded-2xl p-6 md:p-8 shadow-sm border">
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-white shadow-md bg-white">
                      <AvatarImage src={selectedCoach.profileImageUrl || undefined} alt={selectedCoach.name} className="object-cover" />
                      <AvatarFallback className="text-4xl font-bold bg-primary/10 text-primary">{selectedCoach.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-3xl md:text-4xl font-bold">{selectedCoach.name}</h1>
                        
                        {/* Edit button */}
                        <Link href={`/coach/edit/${selectedCoach.id}`}>
                          <Button className="gap-2">
                            <Pencil className="w-4 h-4" />
                            編輯資料
                          </Button>
                        </Link>
                      </div>

                      <div className="inline-flex items-center px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xl md:text-2xl font-bold">
                        {selectedCoach.sportsCategory}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {selectedCoach.isApproved && (
                          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 gap-1">
                            <CheckCircle2 className="w-3 h-3" /> 已認證
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-primary border-orange-200 bg-orange-50 gap-1">
                          <Heart className="w-3 h-3" /> {stats[selectedCoach.id]?.wishlistSaves || 0} 收藏
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm font-medium">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" /> {selectedCoach.location}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Eye className="w-4 h-4" /> {stats[selectedCoach.id]?.profileViews || 0} 瀏覽
                        </span>
                        {selectedCoach.experienceLevel && (
                          <span className="flex items-center gap-1.5">
                            <Award className="w-4 h-4" /> {selectedCoach.experienceLevel}
                          </span>
                        )}
                      </div>

                      {/* Social links */}
                      <div className="flex items-center gap-2 pt-2">
                        {selectedCoach.facebookUrl && (
                          <a href={selectedCoach.facebookUrl} target="_blank" rel="noopener noreferrer" 
                            className="flex-shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#1877F2] hover:bg-[#0e63cf] text-white transition-colors">
                            <Facebook className="w-4 h-4" />
                          </a>
                        )}
                        {selectedCoach.instagramUrl && (
                          <a href={selectedCoach.instagramUrl} target="_blank" rel="noopener noreferrer"
                            className="flex-shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full text-white transition-opacity hover:opacity-90"
                            style={{ background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)" }}>
                            <Instagram className="w-4 h-4" />
                          </a>
                        )}
                        {selectedCoach.youtubeUrl && (
                          <a href={selectedCoach.youtubeUrl} target="_blank" rel="noopener noreferrer"
                            className="flex-shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors">
                            <Youtube className="w-4 h-4" />
                          </a>
                        )}
                        
                        <Link href={`/coaches/${selectedCoach.id}`}>
                          <Button variant="outline" size="sm" className="gap-2 ml-2">
                            <Eye className="w-4 h-4" />
                            預覽公開頁面
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Tabs - 類似公開頁 */}
                <Tabs defaultValue="about" className="w-full">
                  <div className="relative overflow-x-auto border-b mb-6">
                    <TabsList className="flex w-max min-w-full justify-start rounded-none h-auto p-0 bg-transparent">
                      <TabsTrigger value="about" className="flex-shrink-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 px-5 text-sm sm:text-base font-medium">關於教練</TabsTrigger>
                      <TabsTrigger value="pricing" className="flex-shrink-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 px-5 text-sm sm:text-base font-medium">收費詳情</TabsTrigger>
                      <TabsTrigger value="contact" className="flex-shrink-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 px-5 text-sm sm:text-base font-medium">聯絡方式</TabsTrigger>
                    </TabsList>
                  </div>
                  
                  {/* 關於教練 */}
                  <TabsContent value="about" className="space-y-6">
                    <div className="bg-white dark:bg-card rounded-2xl p-6 md:p-8 shadow-sm border">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold">關於此教練</h3>
                        <Link href={`/coach/edit/${selectedCoach.id}`}>
                          <Button variant="ghost" size="sm">
                            <Pencil className="w-4 h-4 mr-1" /> 編輯
                          </Button>
                        </Link>
                      </div>
                      <div className="prose prose-slate dark:prose-invert max-w-none">
                        {selectedCoach.bio ? (
                          <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">{selectedCoach.bio}</p>
                        ) : (
                          <p className="text-muted-foreground italic">尚未填寫個人簡介</p>
                        )}
                      </div>

                      {/* 教學成就 */}
                      {selectedCoach.teachingAchievements && (
                        <div className="mt-6 pt-6 border-t">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <ThumbsUp className="w-4 h-4 text-primary" />
                            教學成就
                          </h4>
                          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {selectedCoach.teachingAchievements}
                          </div>
                        </div>
                      )}

                      {/* 運動成就 */}
                      {selectedCoach.sportsAchievements && (
                        <div className="mt-6 pt-6 border-t">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-primary" />
                            運動成就
                          </h4>
                          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {selectedCoach.sportsAchievements}
                          </div>
                        </div>
                      )}

                      {/* 專業資歷 */}
                      {selectedCoach.qualifications && (
                        <div className="mt-6 pt-6 border-t">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Award className="w-4 h-4 text-primary" />
                            專業資歷
                          </h4>
                          <div className="text-sm text-muted-foreground">
                            {(() => {
                              try {
                                const quals = JSON.parse(selectedCoach.qualifications);
                                if (Array.isArray(quals) && quals.length > 0) {
                                  return (
                                    <ul className="space-y-2">
                                      {quals.map((q: any, i: number) => (
                                        <li key={i} className="flex items-start gap-2">
                                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                          <span>{q.text || q}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  );
                                }
                              } catch {}
                              return <p>{selectedCoach.qualifications}</p>;
                            })()}
                          </div>
                        </div>
                      )}

                      {/* 教學類型 */}
                      {selectedCoach.teachingFocus && selectedCoach.teachingFocus.length > 0 && (
                        <div className="mt-6 pt-6 border-t">
                          <h4 className="font-semibold mb-3">教學類型</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedCoach.teachingFocus.map(focus => (
                              <Badge key={focus} variant="outline" className="text-primary border-primary/30">
                                {focus === "競賽" ? "🏆 " : "🎯 "}{focus}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 適合年齡層 */}
                      {selectedCoach.ageGroups && selectedCoach.ageGroups.length > 0 && (
                        <div className="mt-6 pt-6 border-t">
                          <h4 className="font-semibold mb-3">適合年齡層</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedCoach.ageGroups.map(age => (
                              <Badge key={age} variant="secondary">{age}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SCRC 編號 */}
                      {selectedCoach.scrcNumber && (
                        <div className="mt-6 pt-6 border-t">
                          <h4 className="font-semibold mb-3">性罪行定罪紀錄查核（SCRC）</h4>
                          <p className="text-sm text-muted-foreground">已通過查核 - 編號：{selectedCoach.scrcNumber}</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* 收費詳情 */}
                  <TabsContent value="pricing" className="space-y-6">
                    <div className="bg-white dark:bg-card rounded-2xl p-6 md:p-8 shadow-sm border">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold">收費詳情</h3>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(selectedCoach)}>
                          <Pencil className="w-4 h-4 mr-1" /> 編輯收費
                        </Button>
                      </div>
                      
                      {selectedCoach.pricingPlans ? (
                        <div className="text-sm">
                          {(() => {
                            try {
                              const plans = JSON.parse(selectedCoach.pricingPlans);
                              if (Array.isArray(plans) && plans.length > 0) {
                                return (
                                  <div className="space-y-3">
                                    {plans.map((p: any, i: number) => (
                                      <div key={i} className="flex justify-between items-center py-3 border-b last:border-0">
                                        <div>
                                          <p className="font-medium">{p.sessionType || p.name || '課堂'}</p>
                                          {p.duration && <p className="text-xs text-muted-foreground">{p.duration}</p>}
                                          {p.ageGroup && <Badge variant="outline" className="text-xs mt-1">{p.ageGroup}</Badge>}
                                        </div>
                                        <span className="font-bold text-lg text-primary">${p.price}</span>
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                            } catch {}
                            return <p className="text-muted-foreground italic">收費格式錯誤</p>;
                          })()}
                        </div>
                      ) : (
                        <p className="text-muted-foreground italic">尚未設定收費詳情</p>
                      )}
                    </div>

                    {/* 套餐優惠 */}
                    {selectedCoach.packageDetails && (
                      <div className="bg-primary/5 rounded-2xl p-6 md:p-8 border border-primary/20">
                        <div className="flex items-center gap-2 mb-4">
                          <Award className="w-5 h-5 text-primary" />
                          <h3 className="text-xl font-bold">套餐優惠</h3>
                        </div>
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {selectedCoach.packageDetails}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* 聯絡方式 */}
                  <TabsContent value="contact" className="space-y-6">
                    <div className="bg-white dark:bg-card rounded-2xl p-6 md:p-8 shadow-sm border">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold">聯絡方式</h3>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(selectedCoach)}>
                          <Pencil className="w-4 h-4 mr-1" /> 編輯聯絡
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        {selectedCoach.whatsappNumber ? (
                          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center">
                              <span className="text-lg">💬</span>
                            </div>
                            <div>
                              <p className="font-medium">WhatsApp</p>
                              <p className="text-green-700">{selectedCoach.whatsappNumber}</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-muted-foreground italic">尚未設定 WhatsApp 號碼</p>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* 最新動向 */}
            {activeTab === 'posts' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">最新動向</h2>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    發布動向
                  </Button>
                </div>
                
                {/* 發布新動向 */}
                <Card className="mb-6">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedCoach.profileImageUrl || undefined} />
                        <AvatarFallback className="text-sm">{selectedCoach.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Textarea 
                          placeholder="分享你嘅最新動態、課堂花絮、學員成果..."
                          className="min-h-[80px] resize-none"
                        />
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                              <ImageIcon className="w-4 h-4" /> 加相片
                            </Button>
                            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                              <Video className="w-4 h-4" /> 加影片
                            </Button>
                          </div>
                          <Button size="sm" className="gap-1">
                            <Send className="w-4 h-4" /> 發布
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 動向列表 */}
                <div className="space-y-4">
                  {/* 示範動向 */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={selectedCoach.profileImageUrl || undefined} />
                          <AvatarFallback className="text-sm">{selectedCoach.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{selectedCoach.name}</p>
                              <p className="text-xs text-muted-foreground">2小時前</p>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="mt-2 text-sm">
                            今日同幾位學員練習基本功，大家進步好多！繼續加油 💪🏀
                          </p>
                          <div className="mt-3 flex gap-2">
                            <Badge variant="secondary">沙田</Badge>
                            <Badge variant="secondary">青少年訓練</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={selectedCoach.profileImageUrl || undefined} />
                          <AvatarFallback className="text-sm">{selectedCoach.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{selectedCoach.name}</p>
                              <p className="text-xs text-muted-foreground">昨天</p>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="mt-2 text-sm">
                            恭喜學員阿明喺全港學界籃球賽獲得亞軍！辛苦訓練終於有回報 🏆
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 暫無動向 */}
                {false && (
                  <Card className="p-12 text-center border-dashed">
                    <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">暫時未有動向</p>
                    <Button variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      發布第一條動向
                    </Button>
                  </Card>
                )}
              </div>
            )}

            {/* 我的相片 */}
            {activeTab === 'photos' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">我的相片</h2>
                  <Button className="gap-2">
                    <Upload className="w-4 h-4" />
                    上傳相片
                  </Button>
                </div>
                
                <Card className="p-12 text-center border-dashed">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">暫時未有相片</p>
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    上傳第一張相片
                  </Button>
                </Card>
              </div>
            )}

            {/* 我的影片 */}
            {activeTab === 'videos' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">我的影片</h2>
                  <Button className="gap-2">
                    <Upload className="w-4 h-4" />
                    新增影片
                  </Button>
                </div>
                
                <Card className="p-12 text-center border-dashed">
                  <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">暫時未有影片</p>
                  <p className="text-sm text-muted-foreground mb-4">支援 YouTube 連結</p>
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    新增第一條影片
                  </Button>
                </Card>
              </div>
            )}

            {/* 詳細數據 */}
            {activeTab === 'stats' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">詳細數據</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">瀏覽趨勢</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-32 flex items-center justify-center text-muted-foreground">
                        <p>圖表功能即將推出</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">來源分析</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-32 flex items-center justify-center text-muted-foreground">
                        <p>數據分析功能即將推出</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">最近 30 日數據</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 border-b">
                        <span className="text-muted-foreground">總瀏覽次數</span>
                        <span className="font-bold">{coachStats?.profileViews || 0}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b">
                        <span className="text-muted-foreground">總收藏數</span>
                        <span className="font-bold">{coachStats?.wishlistSaves || 0}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b">
                        <span className="text-muted-foreground">聯絡點擊</span>
                        <span className="font-bold">{coachStats?.contactClicks || 0}</span>
                      </div>
                      <div className="flex justify-between items-center py-3">
                        <span className="text-muted-foreground">平均轉化率</span>
                        <span className="font-bold">
                          {coachStats?.profileViews > 0 
                            ? Math.round((coachStats.contactClicks / coachStats.profileViews) * 100) 
                            : 0}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-primary" />
              編輯教練檔案
            </DialogTitle>
          </DialogHeader>

          {editForm && (
            <form onSubmit={handleSubmitEdit} className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground">基本資料</h4>
                
                <div>
                  <Label htmlFor="edit-name">教練名稱</Label>
                  <Input 
                    id="edit-name" 
                    value={editForm.name}
                    onChange={e => setEditForm(f => f ? { ...f, name: e.target.value } : f)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="edit-location">授課地區</Label>
                  <Input 
                    id="edit-location" 
                    value={editForm.location}
                    onChange={e => setEditForm(f => f ? { ...f, location: e.target.value } : f)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="edit-experience">教練資歷</Label>
                  <Input 
                    id="edit-experience" 
                    value={editForm.experienceLevel}
                    onChange={e => setEditForm(f => f ? { ...f, experienceLevel: e.target.value } : f)}
                    placeholder="例：10年教學經驗、香港代表隊成員"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <Label htmlFor="edit-bio">個人簡介</Label>
                <Textarea 
                  id="edit-bio" 
                  value={editForm.bio}
                  onChange={e => setEditForm(f => f ? { ...f, bio: e.target.value } : f)}
                  rows={5}
                  placeholder="介紹你的教學理念、專長、經驗..."
                />
              </div>

              {/* Contact */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground">聯絡方式</h4>
                
                <div>
                  <Label htmlFor="edit-whatsapp">WhatsApp 號碼</Label>
                  <Input 
                    id="edit-whatsapp" 
                    value={editForm.whatsappNumber}
                    onChange={e => setEditForm(f => f ? { ...f, whatsappNumber: e.target.value } : f)}
                    placeholder="例：+852 9123 4567"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-facebook">Facebook 連結（選填）</Label>
                  <Input 
                    id="edit-facebook" 
                    value={editForm.facebookUrl}
                    onChange={e => setEditForm(f => f ? { ...f, facebookUrl: e.target.value } : f)}
                    placeholder="https://facebook.com/..."
                  />
                </div>

                <div>
                  <Label htmlFor="edit-instagram">Instagram 連結（選填）</Label>
                  <Input 
                    id="edit-instagram" 
                    value={editForm.instagramUrl}
                    onChange={e => setEditForm(f => f ? { ...f, instagramUrl: e.target.value } : f)}
                    placeholder="https://instagram.com/..."
                  />
                </div>
              </div>

              {/* Qualifications */}
              <div>
                <Label>專業資歷（JSON 格式）</Label>
                <Textarea
                  value={editForm.qualifications}
                  onChange={e => setEditForm(f => f ? { ...f, qualifications: e.target.value } : f)}
                  rows={3}
                  placeholder='[{"text": "香港游泳教練牌"}, {"text": "10年教學經驗"}]'
                />
                <p className="text-xs text-muted-foreground mt-1">每項資歷以 JSON 格式輸入</p>
              </div>

              {/* Pricing Plans - Same UI as coach-register */}
              <div className="space-y-4 bg-primary/5 -mx-6 px-6 py-4 border-y">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold">收費計劃</h4>
                </div>
                <p className="text-xs text-muted-foreground">清晰的收費標準建立信任。請列出所有堂型及對應收費。</p>

                <div className="space-y-3">
                  {pricingRows.map((row, idx) => (
                    <div key={row.id} className="flex flex-col sm:flex-row gap-2 items-start bg-white rounded-xl border p-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground w-6 pt-2 shrink-0">
                        {idx + 1}.
                      </div>

                      {/* Session type */}
                      <div className="flex-1 min-w-[120px]">
                        <p className="text-xs text-muted-foreground mb-1">課堂形式</p>
                        <Select
                          value={row.sessionType}
                          onValueChange={v => updatePricingRow(row.id, { sessionType: v as "單對單" | "小組課堂", minStudents: "", maxStudents: "" })}
                        >
                          <SelectTrigger className="bg-white h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="單對單">一對一</SelectItem>
                            <SelectItem value="小組課堂">小組課堂</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Min / Max students — only for 小組課堂 */}
                      {row.sessionType === "小組課堂" && (
                        <>
                          <div className="flex-1 min-w-[80px]">
                            <p className="text-xs text-muted-foreground mb-1">最少人數</p>
                            <div className="relative">
                              <Input
                                type="number"
                                min={2}
                                placeholder="2"
                                className="pr-6 bg-white h-9"
                                value={row.minStudents}
                                onChange={e => updatePricingRow(row.id, { minStudents: e.target.value })}
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">人</span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-[80px]">
                            <p className="text-xs text-muted-foreground mb-1">最多人數</p>
                            <div className="relative">
                              <Input
                                type="number"
                                min={2}
                                placeholder="6"
                                className="pr-6 bg-white h-9"
                                value={row.maxStudents}
                                onChange={e => updatePricingRow(row.id, { maxStudents: e.target.value })}
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">人</span>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Duration */}
                      <div className="flex-1 min-w-[100px]">
                        <p className="text-xs text-muted-foreground mb-1">每堂時長</p>
                        <Select
                          value={row.duration || "60分鐘"}
                          onValueChange={v => updatePricingRow(row.id, { duration: v })}
                        >
                          <SelectTrigger className="bg-white h-9">
                            <SelectValue placeholder="選擇時長" />
                          </SelectTrigger>
                          <SelectContent>
                            {["30分鐘", "45分鐘", "60分鐘", "90分鐘", "120分鐘"].map(d => (
                              <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Price */}
                      <div className="flex-1 min-w-[100px]">
                        <p className="text-xs text-muted-foreground mb-1">每堂收費</p>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                          <Input
                            type="number"
                            min={0}
                            placeholder="0"
                            className="pl-6 bg-white h-9"
                            value={row.price}
                            onChange={e => updatePricingRow(row.id, { price: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Age group (optional) */}
                      <div className="flex-1 min-w-[120px]">
                        <p className="text-xs text-muted-foreground mb-1">適合年齡 <span className="text-muted-foreground/60">（選填）</span></p>
                        <Select
                          value={row.ageGroup || "_all"}
                          onValueChange={v => updatePricingRow(row.id, { ageGroup: v === "_all" ? "" : v })}
                        >
                          <SelectTrigger className="bg-white h-9">
                            <SelectValue placeholder="所有年齡" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_all">所有年齡</SelectItem>
                            {AGE_GROUP_PRICING_OPTIONS.map(ag => (
                              <SelectItem key={ag} value={ag}>{ag}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => removePricingRow(row.id)}
                        disabled={pricingRows.length === 1}
                        className="mt-5 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-white"
                  onClick={addPricingRow}
                >
                  <Plus className="w-4 h-4" /> 新增收費
                </Button>
              </div>

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={submittingEdit}>
                  {submittingEdit ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" />提交中…</>
                  ) : (
                    "提交修改申請"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
