import { Link } from "wouter";
import { Card } from "@/components/ui/card";
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

function getPriceRange(coach: Coach): { min: number; max: number } | null {
  const rows = parsePricingPlans(coach.pricingPlans);
  const prices = rows.map(r => Number(r.price)).filter(n => !isNaN(n) && n > 0);
  if (prices.length > 0) {
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }
  const trial = Number(coach.trialPrice);
  const regular = Number(coach.regularPrice);
  const fallback = [trial, regular].filter(n => !isNaN(n) && n > 0);
  if (fallback.length === 0) return null;
  return { min: Math.min(...fallback), max: Math.max(...fallback) };
}

function stripParens(s: string) {
  return s.replace(/（[^）]*）/g, "").trim();
}

export function CoachCard({ coach }: { coach: Coach }) {
  const priceRange = getPriceRange(coach);
  const ageGroups = (coach.ageGroups || []) as string[];
  const coachTypes = (coach.experienceLevel || "")
    .split(/[、,]/)
    .map(s => s.trim())
    .filter(Boolean);

  return (
    <Link href={`/coaches/${coach.id}`}>
      <Card className="group h-full flex flex-col cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50 bg-white p-5 md:p-6 rounded-2xl">
        {/* Top: name + verification */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-display font-bold text-xl md:text-2xl leading-tight text-foreground truncate">
            {coach.name}
          </h3>
          <div className="flex items-center gap-1.5 shrink-0">
            {coach.isFeatured && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-amber-300 text-amber-700 bg-amber-50 text-xs font-semibold">
                <Crown className="w-3 h-3" />
                精選
              </span>
            )}
            {coach.isApproved && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-emerald-300 text-emerald-700 bg-emerald-50 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                已認證
              </span>
            )}
          </div>
        </div>

        {/* Coach type badges (e.g. 持牌教練 / 專業運動員) */}
        {coachTypes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {coachTypes.map((t, i) => (
              <span
                key={i}
                className="inline-flex items-center px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-semibold"
              >
                {t === "專業運動員" ? "🏅 " : t === "持牌教練" ? "📋 " : ""}
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Sport + age group pills (tan/beige) */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-sm font-medium">
            {coach.sportsCategory}
          </span>
          {ageGroups.slice(0, 5).map((ag, i) => (
            <span
              key={i}
              className="inline-flex items-center px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-sm font-medium"
            >
              {stripParens(ag)}
            </span>
          ))}
        </div>

        {/* Info row: location + rating */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4 flex-wrap">
          {coach.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="truncate max-w-[18ch]">{coach.location}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Star className="w-4 h-4 shrink-0 fill-amber-400 text-amber-400" />
            {coach.averageRating ? (
              <>
                <span className="font-semibold text-foreground">{coach.averageRating.toFixed(1)}</span>
                <span>（{coach.reviewCount} 評價）</span>
              </>
            ) : (
              <span>新教練</span>
            )}
          </span>
        </div>

        {/* Spacer to push price to bottom */}
        <div className="flex-1" />

        {/* Price */}
        <div className="pt-3 border-t border-slate-100">
          {priceRange ? (
            <div className="flex items-baseline gap-1 font-display font-bold text-primary">
              <span className="text-xl md:text-2xl">
                HK${priceRange.min}
                {priceRange.max > priceRange.min ? ` - $${priceRange.max}` : ""}
              </span>
              <span className="text-sm text-muted-foreground font-medium ml-1">/ 堂</span>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">收費請洽教練</div>
          )}
        </div>
      </Card>
    </Link>
  );
}
