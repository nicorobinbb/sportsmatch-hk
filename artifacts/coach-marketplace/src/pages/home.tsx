import { Layout } from "@/components/layout";
import { CoachCard } from "@/components/coach-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, ShieldCheck, Star } from "lucide-react";
import { useState } from "react";
import { useListCoaches, useListCategories, useListFeaturedCoaches, useGetCoachStats, useTrackCategoryClick, useGetUserPreferences } from "@workspace/api-client-react";
import { Empty } from "@/components/ui/empty";

const sportEmojiMap: Record<string, string> = {
  "游泳": "🏊",
  "瑜伽": "🧘",
  "籃球": "🏀",
  "網球": "🎾",
  "拳擊": "🥊",
  "普拉提": "🤸",
  "足球": "⚽",
  "羽毛球": "🏸",
  "跑步": "🏃",
  "舞蹈": "💃",
  "高爾夫球": "⛳",
  "乒乓球": "🏓",
  "體操": "🤼",
  "跆拳道": "🥋",
  "空手道": "🥋",
  "排球": "🏐",
  "劍擊": "🤺",
  "匹克球": "🏓",
  "田徑": "🏅",
};

export default function Home() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedSport, setSelectedSport] = useState<string | undefined>();
  const [selectedLocation, setSelectedLocation] = useState<string | undefined>();
  const [selectedCoachTypes, setSelectedCoachTypes] = useState<Set<string>>(new Set());

  const toggleCoachType = (type: string) =>
    setSelectedCoachTypes(prev => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });

  const { data: stats } = useGetCoachStats();
  const { data: categories } = useListCategories();
  const { data: featuredCoaches, isLoading: isFeaturedLoading } = useListFeaturedCoaches();
  const { data: userPreferences } = useGetUserPreferences();
  
  const { data: coachesData, isLoading: isCoachesLoading } = useListCoaches({
    search: debouncedSearch || undefined,
    sport: selectedSport,
    location: selectedLocation,
    coachType: selectedCoachTypes.size > 0 ? [...selectedCoachTypes].join(",") : undefined,
    limit: 40
  });

  const preferredSports: string[] = userPreferences?.preferredCategories ?? [];
  const isFiltered = !!(debouncedSearch || selectedSport || selectedLocation || selectedCoachTypes.size > 0);

  const sortedCoaches = (() => {
    const coaches = coachesData?.coaches ?? [];
    if (isFiltered || preferredSports.length === 0) return coaches;
    const preferred = coaches.filter(c => preferredSports.includes(c.sportsCategory));
    const rest = coaches.filter(c => !preferredSports.includes(c.sportsCategory));
    return [...preferred, ...rest];
  })();

  const trackClick = useTrackCategoryClick();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(search);
  };

  const handleCategoryClick = (categoryName: string) => {
    if (selectedSport === categoryName) {
      setSelectedSport(undefined);
    } else {
      setSelectedSport(categoryName);
      trackClick.mutate({ data: { category: categoryName } });
    }
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-primary/5 border-b relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-800" />
        <div className="container px-4 md:px-6 py-16 md:py-24 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge variant="secondary" className="px-3 py-1 rounded-full text-sm font-medium border-primary/20 bg-primary/10 text-primary">
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              香港運動教練審核與搜尋平台
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold font-display tracking-tight text-foreground">
              香港最透明、<br />最值得信賴的<br />
              <span className="text-primary relative inline-block mt-2">
                運動教練審核與搜尋平台
                <div className="absolute -bottom-2 left-0 w-full h-3 bg-secondary/40 -z-10 transform -rotate-1" />
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              針對香港運動教練市場資訊不對稱的痛點，建立標準化資歷與評價體系。透過透明的教練檔案、真實評分及公開收費資訊，讓家長與學生快速精準地對比並直接聯繫合適教練，消除盲目嘗試的時間與金錢浪費。
            </p>

            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mt-8 bg-white dark:bg-card p-2 rounded-2xl shadow-lg border">
              <div className="relative flex-1 flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-muted-foreground" />
                <Input 
                  placeholder="搜尋教練姓名或運動項目（中英文均可）…" 
                  className="w-full pl-11 border-0 shadow-none focus-visible:ring-0 text-base h-12"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="hidden sm:block w-px bg-border my-2" />
              <div className="relative flex-1 flex items-center">
                <MapPin className="absolute left-4 w-5 h-5 text-muted-foreground" />
                <Input 
                  placeholder="地區（例如：旺角）" 
                  className="w-full pl-11 border-0 shadow-none focus-visible:ring-0 text-base h-12"
                  value={selectedLocation || ""}
                  onChange={(e) => setSelectedLocation(e.target.value || undefined)}
                />
              </div>
              <Button type="submit" size="lg" className="rounded-xl h-12 px-8 font-bold text-base shadow-md">
                搜尋
              </Button>
            </form>

            {stats && (
              <div className="flex flex-wrap justify-center gap-6 md:gap-12 mt-10 text-sm font-medium text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-foreground font-display">{stats.totalCoaches}</span>
                  位活躍教練
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-foreground font-display">{stats.totalReviews}</span>
                  個已驗證評價
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-foreground font-display">{stats.totalCategories}</span>
                  個運動類別
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 bg-white dark:bg-background border-b">
        <div className="container px-4 md:px-6">
          <h2 className="text-xl font-bold font-display mb-6">按運動類別瀏覽</h2>
          <div className="flex overflow-x-auto pb-4 gap-4 snap-x hide-scrollbar">
            {categories?.map((cat) => {
              const isPreferred = userPreferences?.preferredCategories.includes(cat.name);
              const isSelected = selectedSport === cat.name;
              
              return (
                <button
                  key={cat.name}
                  onClick={() => handleCategoryClick(cat.name)}
                  className={`
                    flex flex-col items-center justify-center min-w-[100px] h-28 rounded-2xl border transition-all snap-center
                    ${isSelected ? 'bg-primary border-primary text-primary-foreground shadow-md' : 
                      isPreferred ? 'bg-blue-50 border-blue-200 hover:border-blue-400' : 
                      'bg-card border-border hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-900'}
                  `}
                >
                  <div className={`mb-2 p-2 rounded-full text-2xl leading-none ${isSelected ? 'bg-white/20' : 'bg-slate-100'}`}>
                    {sportEmojiMap[cat.name] ?? "🏅"}
                  </div>
                  <span className={`font-medium text-sm ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>{cat.name}</span>
                  <span className={`text-xs mt-1 ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {cat.coachCount} 位教練
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 flex-1">
        <div className="container px-4 md:px-6 space-y-16">
          
          {/* Featured Coaches */}
          {!debouncedSearch && !selectedSport && !selectedLocation && featuredCoaches && featuredCoaches.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold font-display flex items-center gap-2">
                  <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                  精選教練
                </h2>
              </div>
              <div className="flex gap-5 overflow-x-auto pb-3 -mx-4 px-4 snap-x snap-mandatory scroll-smooth">
                {featuredCoaches.map((coach) => (
                  <div key={coach.id} className="flex-none w-72 snap-start">
                    <CoachCard coach={coach} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Coaches List */}
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-bold font-display">
                  {selectedSport
                    ? `${selectedSport} 教練`
                    : !isFiltered && preferredSports.length > 0
                      ? '根據您的喜好推薦'
                      : '探索教練'}
                  {selectedLocation && <span className="text-muted-foreground font-normal ml-2">於 {selectedLocation}</span>}
                </h2>
                {!isFiltered && preferredSports.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    優先顯示您感興趣的運動：{preferredSports.join('、')}
                  </p>
                )}
              </div>
            </div>

            {/* Coach type filter pills */}
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              <span className="text-sm text-muted-foreground shrink-0">篩選類型：</span>
              {(["專業運動員", "持牌教練"] as const).map(type => {
                const active = selectedCoachTypes.has(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleCoachType(type)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      active
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-white border-border hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    {type === "專業運動員" ? "🏅" : "📋"} {type}
                    {active && <span className="ml-0.5 opacity-70">✓</span>}
                  </button>
                );
              })}
              {selectedCoachTypes.size > 0 && (
                <button
                  onClick={() => setSelectedCoachTypes(new Set())}
                  className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
                >
                  清除
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
              {coachesData && (
                <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  顯示 {sortedCoaches.length} / {coachesData.total} 個結果
                </span>
              )}
            </div>

            {isCoachesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="rounded-xl border bg-card text-card-foreground shadow-sm h-[380px] overflow-hidden flex flex-col">
                    <Skeleton className="h-32 w-full rounded-none" />
                    <div className="p-4 flex-1">
                      <Skeleton className="h-6 w-2/3 mb-2" />
                      <Skeleton className="h-4 w-1/3 mb-4" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedCoaches.length === 0 ? (
              <Empty
                icon={<Search className="w-12 h-12 text-muted-foreground" />}
                title="找不到教練"
                description="請嘗試調整搜尋條件或瀏覽其他類別。"
                action={
                  <Button variant="outline" onClick={() => {
                    setSearch("");
                    setDebouncedSearch("");
                    setSelectedSport(undefined);
                    setSelectedLocation(undefined);
                  }}>
                    清除篩選
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {sortedCoaches.map((coach) => (
                  <CoachCard key={coach.id} coach={coach} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
