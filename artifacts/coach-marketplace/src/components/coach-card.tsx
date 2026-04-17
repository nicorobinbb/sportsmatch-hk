import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShieldCheck, MapPin, Star, Crown } from "lucide-react";
import type { Coach } from "@workspace/api-client-react";

type PricingRow = { sessionType: "單對單" | "小組課堂"; price: string; minStudents?: string; maxStudents?: string; duration?: string; ageGroup?: string };

function parsePricingPlans(raw?: string | null): PricingRow[] {
  try {
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}
  return [];
}

function stripParens(s: string) {
  return s.replace(/（[^）]*）/g, "").trim();
}

export function CoachCard({ coach }: { coach: Coach }) {
  const ageGroups = (coach.ageGroups || []) as string[];
  const coachTypes = (coach.experienceLevel || "")
    .split(/[、,]/)
    .map(s => s.trim())
    .filter(Boolean);
  const pricingRows = parsePricingPlans(coach.pricingPlans);

  return (
    <Link href={`/coaches/${coach.id}`}>
      <Card className="group h-full flex flex-col cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50 bg-white rounded-2xl overflow-hidden">
        <div className="p-5 md:p-6 flex-1 flex flex-col">
          {/* Top: avatar + name + verification badges */}
          <div className="flex items-start gap-4 mb-3">
            <Avatar className="h-16 w-16 md:h-20 md:w-20 shrink-0 border-2 border-primary/10 shadow-sm bg-white">
              <AvatarImage src={coach.profileImageUrl || undefined} alt={coach.name} className="object-cover" />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold">{coach.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-xl md:text-2xl leading-tight text-foreground mb-1.5 break-words">
                {coach.name}
              </h3>
              <div className="flex flex-wrap items-center gap-1.5">
                {coach.isFeatured && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-amber-300 text-amber-700 bg-amber-50 text-xs font-semibold">
                    <Crown className="w-3 h-3" />
                    精選
                  </span>
                )}
                {coach.isApproved && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-emerald-300 text-emerald-700 bg-emerald-50 text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    已認證
                  </span>
                )}
                {coachTypes.map((t, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2.5 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-semibold"
                  >
                    {t === "專業運動員" ? "🏅 " : t === "持牌教練" ? "📋 " : ""}
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sport row (orange/amber) */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-muted-foreground shrink-0">運動</span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-sm font-medium">
              {coach.sportsCategory}
            </span>
          </div>

          {/* Age group row (rose/pink) */}
          {ageGroups.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs font-semibold text-muted-foreground shrink-0">年齡層</span>
              {ageGroups.slice(0, 5).map((ag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium"
                >
                  {stripParens(ag)}
                </span>
              ))}
            </div>
          )}

          {/* Info row: location + rating */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-1 flex-wrap">
            {coach.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4 shrink-0" />
                <span className="truncate max-w-[20ch]">{coach.location}</span>
              </span>
            )}
            {coach.averageRating ? (
              <span className="inline-flex items-center gap-1.5">
                <Star className="w-4 h-4 shrink-0 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-foreground">{coach.averageRating.toFixed(1)}</span>
                <span>（{coach.reviewCount} 評價）</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Pricing footer (original style) */}
        <div className="bg-slate-50 border-t p-4 flex flex-col items-start gap-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">明碼實價</div>
          {(() => {
            if (pricingRows.length > 0) {
              const visible = pricingRows.slice(0, 3);
              const extra = pricingRows.length - visible.length;
              return (
                <div className="flex flex-wrap gap-1.5 w-full">
                  {visible.map((row, i) => {
                    const isGroup = row.sessionType === "小組課堂";
                    const students = isGroup && row.maxStudents
                      ? row.minStudents ? `${row.minStudents}-${row.maxStudents}人` : `≤${row.maxStudents}人`
                      : null;
                    const dur = row.duration ? row.duration.replace("分鐘", "分") : null;
                    const ag = row.ageGroup ? row.ageGroup.replace(/（[^）]*）/, "") : null;
                    return (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-slate-200 text-xs font-medium text-foreground shadow-sm"
                      >
                        <span>{isGroup ? "👥" : "👤"}</span>
                        <span className="font-bold text-primary">${row.price}</span>
                        {students && <span className="text-muted-foreground">· {students}</span>}
                        {dur && <span className="text-muted-foreground">· {dur}</span>}
                        {ag && <span className="text-muted-foreground/80 border-l border-slate-200 pl-1 ml-0.5">· {ag}</span>}
                      </span>
                    );
                  })}
                  {extra > 0 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-white border border-slate-200 text-xs text-muted-foreground">
                      +{extra} 更多
                    </span>
                  )}
                </div>
              );
            }
            // Legacy fallback
            const hasDiscount = Number(coach.trialPrice) < Number(coach.regularPrice);
            return (
              <div className="flex items-baseline gap-3 w-full">
                {hasDiscount && (
                  <>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">體驗堂</span>
                      <span className="font-display font-bold text-primary text-lg">${coach.trialPrice}</span>
                    </div>
                    <div className="w-px h-8 bg-border" />
                  </>
                )}
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">正課 / 小時</span>
                  <span className="font-display font-bold text-foreground text-lg">${coach.regularPrice}</span>
                </div>
              </div>
            );
          })()}
        </div>
      </Card>
    </Link>
  );
}
