import { Router } from "express";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";

const router = Router();

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function buildPricingPlans(pricingPlans: string | null | undefined, trialPrice: number, regularPrice: number): string {
  if (pricingPlans) return pricingPlans;
  if (trialPrice > 0 && trialPrice < regularPrice) {
    return JSON.stringify([
      { sessionType: "單對單", price: String(Math.round(trialPrice)) },
      { sessionType: "單對單", price: String(Math.round(regularPrice)) },
    ]);
  }
  if (regularPrice > 0) {
    return JSON.stringify([{ sessionType: "單對單", price: String(Math.round(regularPrice)) }]);
  }
  return JSON.stringify([]);
}

router.get("/coaches", async (req, res) => {
  try {
    const sport = typeof req.query.sport === "string" ? req.query.sport : undefined;
    const location = typeof req.query.location === "string" ? req.query.location : undefined;

    let query = supabaseAdmin.from("coaches").select("*").eq("is_approved", true);
    if (sport) query = query.eq("sports_category", sport);
    if (location) query = query.ilike("location", `%${location}%`);

    const { data, error } = await query.order("is_featured", { ascending: false }).order("created_at", { ascending: false }).limit(100);
    if (error) throw error;

    const coaches = (data ?? []).map((c: any) => {
      const trialPrice = toNumber(c.trial_price);
      const regularPrice = toNumber(c.regular_price);
      return {
        id: c.id,
        userId: c.user_id,
        name: c.name,
        sportsCategory: c.sports_category,
        location: c.location,
        bio: c.bio,
        trialPrice,
        regularPrice,
        packageDetails: c.package_details,
        ageGroups: c.age_groups ?? [],
        teachingFocus: c.teaching_focus ?? [],
        experienceLevel: c.experience_level ?? "",
        isProfessionalAthleteVerified: !!c.is_professional_athlete_verified,
        isLicensedCoachVerified: !!c.is_licensed_coach_verified,
        isFeatured: !!c.is_featured,
        isApproved: !!c.is_approved,
        profileImageUrl: c.profile_image_url,
        coverPhotoUrl: c.cover_photo_url,
        pricingPlans: buildPricingPlans(c.pricing_plans, trialPrice, regularPrice),
        createdAt: new Date(c.created_at).toISOString(),
        averageRating: null,
        reviewCount: 0,
        profileViews: 0,
        wishlistSaves: 0,
      };
    });

    res.json({ coaches, total: coaches.length });
  } catch (err) {
    req.log.error({ err }, "public list coaches error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/coaches/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid ID" });

    const { data: coach, error: coachError } = await supabaseAdmin.from("coaches").select("*").eq("id", id).maybeSingle();
    if (coachError) throw coachError;
    if (!coach) return res.status(404).json({ error: "Coach not found" });

    const { data: reviews } = await supabaseAdmin.from("reviews").select("*").eq("coach_id", id).eq("is_approved", true).order("created_at", { ascending: false });
    const { data: photos } = await supabaseAdmin.from("photos").select("*").eq("coach_id", id).eq("is_approved", true).order("created_at", { ascending: false });

    const trialPrice = toNumber((coach as any).trial_price);
    const regularPrice = toNumber((coach as any).regular_price);

    res.json({
      id: (coach as any).id,
      userId: (coach as any).user_id,
      name: (coach as any).name,
      sportsCategory: (coach as any).sports_category,
      location: (coach as any).location,
      bio: (coach as any).bio,
      trialPrice,
      regularPrice,
      packageDetails: (coach as any).package_details,
      ageGroups: (coach as any).age_groups ?? [],
      teachingFocus: (coach as any).teaching_focus ?? [],
      experienceLevel: (coach as any).experience_level ?? "",
      isProfessionalAthleteVerified: !!(coach as any).is_professional_athlete_verified,
      isLicensedCoachVerified: !!(coach as any).is_licensed_coach_verified,
      isFeatured: !!(coach as any).is_featured,
      isApproved: !!(coach as any).is_approved,
      profileImageUrl: (coach as any).profile_image_url,
      coverPhotoUrl: (coach as any).cover_photo_url,
      qualifications: (coach as any).qualifications,
      teachingAchievements: (coach as any).teaching_achievements,
      sportsAchievements: (coach as any).sports_achievements,
      pricingPlans: buildPricingPlans((coach as any).pricing_plans, trialPrice, regularPrice),
      whatsappNumber: (coach as any).whatsapp_number,
      youtubeUrl: (coach as any).youtube_url,
      youtubePending: (coach as any).youtube_pending,
      facebookUrl: (coach as any).facebook_url,
      instagramUrl: (coach as any).instagram_url,
      websiteUrl: (coach as any).website_url,
      scrcNumber: (coach as any).scrc_number,
      averageRating: null,
      reviewCount: Array.isArray(reviews) ? reviews.length : 0,
      profileViews: 0,
      wishlistSaves: 0,
      createdAt: new Date((coach as any).created_at).toISOString(),
      reviews: (reviews ?? []).map((r: any) => ({ ...r, createdAt: new Date(r.created_at).toISOString() })),
      photos: (photos ?? []).map((p: any) => ({ ...p, createdAt: new Date(p.created_at).toISOString() })),
    });
  } catch (err) {
    req.log.error({ err }, "public get coach error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/coaches/:id/reviews", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid ID" });
  const { data, error } = await supabaseAdmin.from("reviews").select("*").eq("coach_id", id).eq("is_approved", true).order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Internal server error" });
  return res.json((data ?? []).map((r: any) => ({ ...r, createdAt: new Date(r.created_at).toISOString() })));
});

router.get("/coaches/:id/photos", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid ID" });
  const { data, error } = await supabaseAdmin.from("photos").select("*").eq("coach_id", id).eq("is_approved", true).order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Internal server error" });
  return res.json((data ?? []).map((p: any) => ({ ...p, createdAt: new Date(p.created_at).toISOString() })));
});

router.get("/reviews/coach/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid ID" });
  const { data, error } = await supabaseAdmin.from("reviews").select("*").eq("coach_id", id).eq("is_approved", true).order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Internal server error" });
  return res.json((data ?? []).map((r: any) => ({ ...r, createdAt: new Date(r.created_at).toISOString() })));
});

router.get("/photos/coach/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid ID" });
  const { data, error } = await supabaseAdmin.from("photos").select("*").eq("coach_id", id).eq("is_approved", true).order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Internal server error" });
  return res.json((data ?? []).map((p: any) => ({ ...p, createdAt: new Date(p.created_at).toISOString() })));
});

router.get("/categories", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from("coaches").select("sports_category").eq("is_approved", true);
    if (error) throw error;
    const counts = new Map<string, number>();
    for (const row of data ?? []) {
      const name = (row as any).sports_category;
      if (!name || name === "個人訓練") continue;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    res.json(Array.from(counts.entries()).map(([name, coachCount]) => ({ name, coachCount })).sort((a, b) => b.coachCount - a.coachCount));
  } catch (err) {
    req.log.error({ err }, "public categories error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/featured", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("coaches")
      .select("*")
      .eq("is_approved", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(6);
    if (error) throw error;
    const featured = (data ?? []).map((c: any) => {
      const trialPrice = toNumber(c.trial_price);
      const regularPrice = toNumber(c.regular_price);
      return {
        id: c.id,
        userId: c.user_id,
        name: c.name,
        sportsCategory: c.sports_category,
        location: c.location,
        bio: c.bio,
        trialPrice,
        regularPrice,
        packageDetails: c.package_details,
        ageGroups: c.age_groups ?? [],
        experienceLevel: c.experience_level ?? "",
        isFeatured: !!c.is_featured,
        isApproved: !!c.is_approved,
        profileImageUrl: c.profile_image_url,
        pricingPlans: buildPricingPlans(c.pricing_plans, trialPrice, regularPrice),
        createdAt: new Date(c.created_at).toISOString(),
        averageRating: null,
        reviewCount: 0,
      };
    });
    res.json(featured);
  } catch (err) {
    req.log.error({ err }, "public featured error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/coaches/stats/summary", async (req, res) => {
  try {
    const coachesRes = await supabaseAdmin.from("coaches").select("*", { count: "exact", head: true }).eq("is_approved", true);
    const reviewsRes = await supabaseAdmin.from("reviews").select("*", { count: "exact", head: true }).eq("is_approved", true);
    const featuredRes = await supabaseAdmin.from("coaches").select("*", { count: "exact", head: true }).eq("is_approved", true).eq("is_featured", true);
    const categoriesRes = await supabaseAdmin.from("coaches").select("sports_category").eq("is_approved", true);
    const totalCategories = new Set((categoriesRes.data ?? []).map((r: any) => r.sports_category).filter(Boolean)).size;

    res.json({
      totalCoaches: coachesRes.count ?? 0,
      totalReviews: reviewsRes.count ?? 0,
      totalCategories,
      featuredCount: featuredRes.count ?? 0,
    });
  } catch (err) {
    req.log.error({ err }, "public stats summary error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

