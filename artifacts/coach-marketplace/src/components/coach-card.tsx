import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, CheckCircle2, Crown } from "lucide-react";
import type { Coach } from "@workspace/api-client-react/src/generated/api.schemas";

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

        <CardFooter className="bg-slate-50 dark:bg-card-foreground/5 border-t p-4 flex flex-col items-start gap-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">明碼實價</div>
          <div className="flex justify-between w-full items-baseline">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">體驗堂</span>
              <span className="font-display font-bold text-primary text-lg">${coach.trialPrice}</span>
            </div>
            <div className="w-px h-8 bg-border mx-4" />
            <div className="flex flex-col text-right">
              <span className="text-xs text-muted-foreground">正課 / 小時</span>
              <span className="font-display font-bold text-foreground text-lg">${coach.regularPrice}</span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
