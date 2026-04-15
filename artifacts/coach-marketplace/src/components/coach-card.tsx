import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, CheckCircle2, Crown } from "lucide-react";
import type { Coach } from "@workspace/api-client-react/src/generated/api.schemas";

export function CoachCard({ coach }: { coach: Coach }) {
  return (
    <Link href={`/coaches/${coach.id}`}>
      <Card className="group overflow-hidden h-full flex flex-col cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50 bg-white">
        <CardHeader className="p-0 relative">
          <div className="h-32 w-full relative overflow-hidden bg-gradient-to-r from-primary/20 to-primary/5">
            {coach.coverPhotoUrl ? (
              <img src={coach.coverPhotoUrl} alt="封面" className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-center gap-2 opacity-30">
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">運</div>
                  <span className="text-lg font-bold text-primary">運對</span>
                </div>
              </div>
            )}
          </div>
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {coach.isFeatured && (
              <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 text-white font-semibold flex items-center gap-1">
                <Crown className="w-3 h-3" /> 精選
              </Badge>
            )}
            <Badge variant="secondary" className="w-fit font-medium bg-white/80 backdrop-blur-sm">
              {coach.sportsCategory}
            </Badge>
          </div>
          <Avatar className="h-20 w-20 absolute -bottom-10 left-6 border-4 border-white shadow-sm bg-white">
            <AvatarImage src={coach.profileImageUrl || undefined} alt={coach.name} className="object-cover" />
            <AvatarFallback className="text-xl bg-primary/10 text-primary">{coach.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </CardHeader>
        <CardContent className="pt-14 pb-4 flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-display font-bold text-lg leading-none flex items-center gap-1.5">
                {coach.name}
                {coach.isApproved && (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                )}
              </h3>
              <div className="flex items-center text-muted-foreground text-sm mt-1 gap-1">
                <MapPin className="w-3 h-3" />
                <span>{coach.location}</span>
              </div>
            </div>
            <div className="flex items-center bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-md text-amber-600 dark:text-amber-400 font-medium text-sm">
              <Star className="w-3.5 h-3.5 fill-current mr-1" />
              {coach.averageRating ? coach.averageRating.toFixed(1) : "New"}
              <span className="text-xs text-amber-600/70 dark:text-amber-400/70 ml-1">({coach.reviewCount})</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-3">{coach.bio}</p>
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
