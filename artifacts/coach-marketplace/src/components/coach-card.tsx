import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, CheckCircle2, Crown } from "lucide-react";
import type { Coach } from "@workspace/api-client-react/src/generated/api.schemas";

type PricingRow = { sessionType: "單對單" | "小組課堂"; price: string; minStudents?: string; maxStudents?: string; duration?: string };

function parsePricingPlans(raw?: string | null): PricingRow[] {
  try {
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}
  return [];
}

export function CoachCard({ coach }: { coach: Coach }) {
  return (
    <Link href={`/coaches/${coach.id}`}>
      <Card className="group overflow-hidden h-full flex flex-col cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50 bg-white">
        <CardContent className="pt-5 pb-4 flex-1">
          {/* Top row: avatar + name/location + rating */}
          <div className="flex items-start gap-4 mb-4">
            <Avatar className="h-16 w-16 shrink-0 border-2 border-primary/10 shadow-sm bg-white">
              <AvatarImage src={coach.profileImageUrl || undefined} alt={coach.name} className="object-cover" />
              <AvatarFallback className="text-xl bg-primary/10 text-primary font-bold">{coach.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-base leading-tight flex items-center gap-1 flex-wrap">
                <span className="truncate">{coach.name}</span>
                {coach.isApproved && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />}
              </h3>
              <div className="flex items-center text-muted-foreground text-xs mt-0.5 gap-1">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{coach.location}</span>
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {coach.isFeatured && (
                  <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-1.5 py-0 h-5 flex items-center gap-0.5">
                    <Crown className="w-2.5 h-2.5" /> 精選
                  </Badge>
                )}
                <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5 bg-primary/10 text-primary border-0">
                  {coach.sportsCategory}
                </Badge>
              </div>
            </div>
            <div className="flex items-center bg-amber-50 border border-amber-100 px-2 py-1 rounded-lg text-amber-600 font-medium text-xs shrink-0">
              <Star className="w-3 h-3 fill-current mr-0.5" />
              {coach.averageRating ? coach.averageRating.toFixed(1) : "New"}
              <span className="text-amber-500/70 ml-0.5">({coach.reviewCount})</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{coach.bio}</p>
        </CardContent>

        <CardFooter className="bg-slate-50 dark:bg-card-foreground/5 border-t p-4 flex flex-col items-start gap-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">明碼實價</div>
          {(() => {
            const rows = parsePricingPlans(coach.pricingPlans);
            if (rows.length > 0) {
              const visible = rows.slice(0, 3);
              const extra = rows.length - visible.length;
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
        </CardFooter>
      </Card>
    </Link>
  );
}
