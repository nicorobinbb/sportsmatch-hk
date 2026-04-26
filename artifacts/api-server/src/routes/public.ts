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

const SEARCH_SYNONYM_MAP: Record<string, string[]> = {
  "游水": ["游泳"],
  "學游水": ["游泳"],
  "swim": ["游泳"],
  "swimming": ["游泳"],
  "gym": ["健身"],
  "健身房": ["健身"],
  "pt": ["健身"],
  "workout": ["健身"],
  "田徑": ["田徑", "跑步"],
  "athletics": ["田徑"],
  "running": ["跑步", "田徑"],
};

function expandSearchTerms(raw: string): string[] {
  const base = raw
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  const out = new Set<string>(base);
  for (const token of base) {
    const extra = SEARCH_SYNONYM_MAP[token] ?? [];
    extra.forEach((v) => out.add(v));
  }
  return Array.from(out);
}

function getAdminUserIdSet(): Set<string> {
  const raw = process.env.ADMIN_USER_IDS ?? "";
  return new Set(
    raw
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
  );
}

function isAdminRequest(req: any): boolean {
  const userId = req.user?.id;
  if (!userId) return false;
  return getAdminUserIdSet().has(userId);
}

function requireUserId(req: any, res: any): string | null {
  const userId = req.user?.id ?? null;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return userId;
}

router.get("/admin/status", (req, res) => {
  const userId = req.user?.id ?? null;
  const adminSet = getAdminUserIdSet();
  const isAdmin = !!userId && adminSet.has(userId);
  res.json({ isAdmin, userId });
});

router.get("/admin/coaches/all", async (req, res) => {
  try {
    if (!isAdminRequest(req)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const status = typeof req.query.status === "string" ? req.query.status : "all";

    let query = supabaseAdmin
      .from("coaches")
      .select("*")
      .order("created_at", { ascending: false });

    if (search) {
      const escaped = search.replace(/,/g, " ");
      query = query.or(
        [
          `name.ilike.%${escaped}%`,
          `sports_category.ilike.%${escaped}%`,
          `location.ilike.%${escaped}%`,
          `bio.ilike.%${escaped}%`,
        ].join(",")
      );
    }

    if (status === "active") query = query.eq("is_approved", true).eq("is_rejected", false);
    if (status === "inactive") query = query.eq("is_approved", false).eq("is_rejected", false);
    if (status === "rejected") query = query.eq("is_rejected", true);

    const { data, error } = await query.limit(500);
    if (error) throw error;

    const coaches = (data ?? []).map((c: any) => ({
      id: c.id,
      name: c.name,
      sportsCategory: c.sports_category,
      location: c.location,
      isApproved: !!c.is_approved,
      isRejected: !!c.is_rejected,
      isFeatured: !!c.is_featured,
      isProfessionalAthleteVerified: !!c.is_professional_athlete_verified,
      isLicensedCoachVerified: !!c.is_licensed_coach_verified,
      experienceLevel: c.experience_level ?? null,
      whatsappNumber: c.whatsapp_number ?? null,
      bio: c.bio ?? null,
      packageDetails: c.package_details ?? null,
      pricingPlans: c.pricing_plans ?? null,
      qualifications: c.qualifications ?? null,
      youtubePending: c.youtube_pending ?? null,
      createdAt: new Date(c.created_at).toISOString(),
    }));

    return res.json({ coaches });
  } catch (err) {
    req.log.error({ err }, "public admin coaches all error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/coaches", async (req, res) => {
  try {
    const sport = typeof req.query.sport === "string" ? req.query.sport : undefined;
    const location = typeof req.query.location === "string" ? req.query.location : undefined;
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const coachType = typeof req.query.coachType === "string" ? req.query.coachType : "";
    const teachingFocus = typeof req.query.teachingFocus === "string" ? req.query.teachingFocus : "";
    const limit = Number(req.query.limit);
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 200) : 100;

    let query = supabaseAdmin.from("coaches").select("*").eq("is_approved", true);
    if (sport) query = query.eq("sports_category", sport);
    if (location) query = query.ilike("location", `%${location}%`);
    if (search) {
      const terms = expandSearchTerms(search);
      query = query.or(
        terms
          .flatMap((t) => [
            `name.ilike.%${t}%`,
            `sports_category.ilike.%${t}%`,
            `location.ilike.%${t}%`,
            `bio.ilike.%${t}%`,
            `experience_level.ilike.%${t}%`,
          ])
          .join(",")
      );
    }

    const selectedTypes = coachType
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    if (selectedTypes.length === 1 && selectedTypes[0] === "專業運動員") {
      query = query.eq("is_professional_athlete_verified", true);
    } else if (selectedTypes.length === 1 && selectedTypes[0] === "持牌教練") {
      query = query.eq("is_licensed_coach_verified", true);
    } else if (selectedTypes.length > 1) {
      query = query.or("is_professional_athlete_verified.eq.true,is_licensed_coach_verified.eq.true");
    }

    const { data, error } = await query.order("is_featured", { ascending: false }).order("created_at", { ascending: false }).limit(safeLimit);
    if (error) throw error;

    let coaches = (data ?? []).map((c: any) => {
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

    const focusFilters = teachingFocus
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    if (focusFilters.length) {
      coaches = coaches.filter((c: any) => {
        const arr = Array.isArray(c.teachingFocus) ? c.teachingFocus : [];
        return arr.some((v: string) => focusFilters.includes(v));
      });
    }

    res.json({ coaches, total: coaches.length });
  } catch (err) {
    req.log.error({ err }, "public list coaches error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/coaches", async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const b = req.body ?? {};
    const name = String(b.name ?? "").trim();
    const sportsCategory = String(b.sportsCategory ?? "").trim();
    const location = String(b.location ?? "").trim();
    const bio = String(b.bio ?? "").trim();
    if (!name || !sportsCategory || !location || !bio) {
      return res.status(400).json({ error: "Missing required coach fields" });
    }

    // Insert the guaranteed columns first to avoid schema mismatch 500s.
    const basePayload: Record<string, unknown> = {
      user_id: userId,
      name,
      sports_category: sportsCategory,
      location,
      bio,
      is_approved: false,
      is_rejected: false,
      is_featured: false,
    };

    const { data, error } = await supabaseAdmin.from("coaches").insert(basePayload).select("*").maybeSingle();
    if (error) throw error;
    if (!data?.id) return res.status(201).json(data ?? { ok: true });

    // Best-effort optional columns; ignore failures from older/newer schemas.
    const optionalPatch: Record<string, unknown> = {
      trial_price: String(toNumber(b.trialPrice, 0)),
      regular_price: String(toNumber(b.regularPrice, 0)),
      package_details: b.packageDetails ?? null,
      age_groups: Array.isArray(b.ageGroups) ? b.ageGroups : [],
      teaching_focus: Array.isArray(b.teachingFocus) ? b.teachingFocus : [],
      experience_level: b.experienceLevel ?? "",
      profile_image_url: b.profileImageUrl ?? null,
      whatsapp_number: b.whatsappNumber ?? null,
      qualifications: b.qualifications ?? null,
      pricing_plans: b.pricingPlans ?? null,
      is_professional_athlete_verified: false,
      is_licensed_coach_verified: false,
    };
    const patchAttempts = Object.entries(optionalPatch).map(async ([key, value]) =>
      supabaseAdmin.from("coaches").update({ [key]: value }).eq("id", data.id)
    );
    await Promise.allSettled(patchAttempts);

    const { data: latest } = await supabaseAdmin.from("coaches").select("*").eq("id", data.id).maybeSingle();
    return res.status(201).json(latest ?? data);
  } catch (err) {
    req.log.error({ err }, "public create coach error");
    return res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" });
  }
});

router.get("/coaches/me", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data, error } = await supabaseAdmin
      .from("coaches")
      .select("id,name,sports_category,location,is_approved,pending_edits,profile_image_url,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const coaches = (data ?? []).map((c: any) => ({
      id: c.id,
      name: c.name,
      sportsCategory: c.sports_category,
      location: c.location,
      isApproved: !!c.is_approved,
      pendingEdits: c.pending_edits ?? null,
      profileImageUrl: c.profile_image_url ?? null,
      createdAt: new Date(c.created_at).toISOString(),
    }));

    return res.json({ coaches });
  } catch (err) {
    req.log.error({ err }, "public get my coaches error");
    return res.status(500).json({ error: "Internal server error" });
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

router.get("/coaches/me/stats", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  res.json({ stats: {} });
});

router.patch("/coaches/:id/edit-request", async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid ID" });

    const { data: coach, error: coachErr } = await supabaseAdmin
      .from("coaches")
      .select("id,user_id")
      .eq("id", id)
      .maybeSingle();
    if (coachErr) throw coachErr;
    if (!coach) return res.status(404).json({ error: "Coach not found" });
    if (coach.user_id !== userId) return res.status(403).json({ error: "Forbidden" });

    const edits = req.body ?? {};
    const { data: updated, error } = await supabaseAdmin
      .from("coaches")
      .update({ pending_edits: JSON.stringify(edits) })
      .eq("id", id)
      .select("pending_edits")
      .maybeSingle();
    if (error) throw error;
    res.json({ pendingEdits: updated?.pending_edits ?? null });
  } catch (err) {
    req.log.error({ err }, "public coach edit request error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/coaches/:id/youtube", async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid ID" });
    const youtubeUrl = typeof req.body?.youtubeUrl === "string" ? req.body.youtubeUrl.trim() : null;

    const { data: coach, error: coachErr } = await supabaseAdmin
      .from("coaches")
      .select("id,user_id")
      .eq("id", id)
      .maybeSingle();
    if (coachErr) throw coachErr;
    if (!coach) return res.status(404).json({ error: "Coach not found" });
    if (coach.user_id !== userId) return res.status(403).json({ error: "Forbidden" });

    const { data: updated, error } = await supabaseAdmin
      .from("coaches")
      .update({ youtube_pending: youtubeUrl })
      .eq("id", id)
      .select("youtube_pending")
      .maybeSingle();
    if (error) throw error;
    res.json({ youtubePending: updated?.youtube_pending ?? null });
  } catch (err) {
    req.log.error({ err }, "public coach youtube error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/user/profile", async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { data, error } = await supabaseAdmin
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    const profile = data
      ? {
          firstName: data.first_name ?? null,
          lastName: data.last_name ?? null,
          preferredSports: data.preferred_sports ?? [],
          preferredDistricts: data.preferred_districts ?? [],
          preferredAgeGroups: data.preferred_age_groups ?? [],
          goals: data.goals ?? [],
          onboardingCompleted: !!data.onboarding_completed,
        }
      : null;
    res.json({ profile });
  } catch (err) {
    req.log.error({ err }, "public get user profile error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/user/profile", async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const body = req.body ?? {};
    const payload = {
      user_id: userId,
      first_name: body.firstName ?? null,
      last_name: body.lastName ?? null,
      preferred_sports: Array.isArray(body.preferredSports) ? body.preferredSports : [],
      preferred_districts: Array.isArray(body.preferredDistricts) ? body.preferredDistricts : [],
      preferred_age_groups: Array.isArray(body.preferredAgeGroups) ? body.preferredAgeGroups : [],
      goals: Array.isArray(body.goals) ? body.goals : [],
      onboarding_completed: !!body.onboardingCompleted,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabaseAdmin.from("user_profiles").upsert(payload, { onConflict: "user_id" });
    if (error) throw error;
    res.json({
      profile: {
        firstName: payload.first_name,
        lastName: payload.last_name,
        preferredSports: payload.preferred_sports,
        preferredDistricts: payload.preferred_districts,
        preferredAgeGroups: payload.preferred_age_groups,
        goals: payload.goals,
        onboardingCompleted: payload.onboarding_completed,
      },
    });
  } catch (err) {
    req.log.error({ err }, "public update user profile error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/wishlist", async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { data, error } = await supabaseAdmin
      .from("wishlists")
      .select("coach_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const coachIds = Array.from(new Set((data ?? []).map((w: any) => Number(w.coach_id)).filter((v: number) => Number.isFinite(v))));
    if (coachIds.length === 0) return res.json({ coaches: [] });
    const { data: coachesData, error: coachesErr } = await supabaseAdmin
      .from("coaches")
      .select("*")
      .in("id", coachIds);
    if (coachesErr) throw coachesErr;
    const orderMap = new Map<number, number>();
    coachIds.forEach((id, i) => orderMap.set(id, i));
    const coaches = (coachesData ?? [])
      .sort((a: any, b: any) => (orderMap.get(a.id) ?? 9999) - (orderMap.get(b.id) ?? 9999))
      .map((c: any) => ({
        id: c.id,
        userId: c.user_id,
        name: c.name,
        sportsCategory: c.sports_category,
        location: c.location,
        bio: c.bio,
        trialPrice: toNumber(c.trial_price),
        regularPrice: toNumber(c.regular_price),
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
        pricingPlans: c.pricing_plans ?? null,
        createdAt: new Date(c.created_at).toISOString(),
        averageRating: null,
        reviewCount: 0,
        profileViews: 0,
        wishlistSaves: 0,
      }));
    res.json({ coaches });
  } catch (err) {
    req.log.error({ err }, "public wishlist list error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/wishlist/check/:id", async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const coachId = Number(req.params.id);
    if (!Number.isFinite(coachId)) return res.status(400).json({ error: "Invalid ID" });
    const { data, error } = await supabaseAdmin
      .from("wishlists")
      .select("id")
      .eq("user_id", userId)
      .eq("coach_id", coachId)
      .limit(1);
    if (error) throw error;
    res.json({ isSaved: (data ?? []).length > 0 });
  } catch (err) {
    req.log.error({ err }, "public wishlist check error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/wishlist", async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const coachId = Number(req.body?.coachId);
    if (!Number.isFinite(coachId)) return res.status(400).json({ error: "Invalid coachId" });
    const { error } = await supabaseAdmin.from("wishlists").upsert({ user_id: userId, coach_id: coachId }, { onConflict: "user_id,coach_id" });
    if (error) throw error;
    res.status(201).json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "public wishlist add error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/wishlist/:id", async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const coachId = Number(req.params.id);
    if (!Number.isFinite(coachId)) return res.status(400).json({ error: "Invalid ID" });
    const { error } = await supabaseAdmin.from("wishlists").delete().eq("user_id", userId).eq("coach_id", coachId);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "public wishlist remove error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/posts/coach/:id", async (req, res) => {
  const coachId = Number(req.params.id);
  if (!Number.isFinite(coachId)) return res.status(400).json({ error: "Invalid ID" });
  const { data, error } = await supabaseAdmin
    .from("coach_posts")
    .select("*")
    .eq("coach_id", coachId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Internal server error" });
  return res.json((data ?? []).map((p: any) => ({ ...p, createdAt: new Date(p.created_at).toISOString() })));
});

router.get("/posts/coach/:id/my", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const coachId = Number(req.params.id);
  if (!Number.isFinite(coachId)) return res.status(400).json({ error: "Invalid ID" });
  const { data: coach, error: coachErr } = await supabaseAdmin.from("coaches").select("id,user_id").eq("id", coachId).maybeSingle();
  if (coachErr) return res.status(500).json({ error: "Internal server error" });
  if (!coach || coach.user_id !== userId) return res.status(403).json({ error: "Forbidden" });
  const { data, error } = await supabaseAdmin.from("coach_posts").select("*").eq("coach_id", coachId).order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Internal server error" });
  return res.json((data ?? []).map((p: any) => ({ ...p, createdAt: new Date(p.created_at).toISOString() })));
});

router.post("/posts/coach/:id", async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const coachId = Number(req.params.id);
    if (!Number.isFinite(coachId)) return res.status(400).json({ error: "Invalid ID" });
    const { data: coach, error: coachErr } = await supabaseAdmin.from("coaches").select("id,user_id").eq("id", coachId).maybeSingle();
    if (coachErr) throw coachErr;
    if (!coach || coach.user_id !== userId) return res.status(403).json({ error: "Forbidden" });

    const body = req.body ?? {};
    const payload = {
      coach_id: coachId,
      caption: body.caption ?? null,
      media_urls: Array.isArray(body.mediaUrls) ? JSON.stringify(body.mediaUrls) : null,
      youtube_url: body.youtubeUrl ?? null,
      is_approved: true,
      is_rejected: false,
      created_by: userId,
    };
    const { data, error } = await supabaseAdmin.from("coach_posts").insert(payload).select("*").maybeSingle();
    if (error) throw error;
    return res.status(201).json(data ?? { ok: true });
  } catch (err) {
    req.log.error({ err }, "public create post error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/posts/:id", async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const postId = Number(req.params.id);
    if (!Number.isFinite(postId)) return res.status(400).json({ error: "Invalid ID" });
    const { data: post, error: postErr } = await supabaseAdmin.from("coach_posts").select("id,coach_id").eq("id", postId).maybeSingle();
    if (postErr) throw postErr;
    if (!post) return res.status(404).json({ error: "Post not found" });
    const { data: coach } = await supabaseAdmin.from("coaches").select("id,user_id").eq("id", post.coach_id).maybeSingle();
    if (!coach || coach.user_id !== userId) return res.status(403).json({ error: "Forbidden" });
    const { error } = await supabaseAdmin.from("coach_posts").delete().eq("id", postId);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "public delete post error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/reports", async (req, res) => {
  try {
    const userId = req.user?.id ?? null;
    const body = req.body ?? {};
    const payload = {
      coach_id: body.coachId ?? null,
      reason: body.reason ?? "other",
      description: body.description ?? null,
      reporter_user_id: userId,
      status: "pending",
    };
    const { error } = await supabaseAdmin.from("reports").insert(payload);
    if (error) throw error;
    res.status(201).json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "public create report error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/reviews/:id/reply", async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const reviewId = Number(req.params.id);
    if (!Number.isFinite(reviewId)) return res.status(400).json({ error: "Invalid ID" });
    const replyComment = typeof req.body?.replyComment === "string" ? req.body.replyComment.trim() : "";
    if (!replyComment) return res.status(400).json({ error: "replyComment is required" });
    const { data: review } = await supabaseAdmin.from("reviews").select("id,coach_id").eq("id", reviewId).maybeSingle();
    if (!review) return res.status(404).json({ error: "Review not found" });
    const { data: coach } = await supabaseAdmin.from("coaches").select("id,user_id").eq("id", review.coach_id).maybeSingle();
    if (!coach || coach.user_id !== userId) return res.status(403).json({ error: "Forbidden" });
    const { error } = await supabaseAdmin
      .from("reviews")
      .update({ reply_comment: replyComment, reply_at: new Date().toISOString(), reply_by: userId })
      .eq("id", reviewId);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "public review reply error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/coaches/pending", async (req, res) => {
  if (!isAdminRequest(req)) return res.status(403).json({ error: "Forbidden" });
  const { data, error } = await supabaseAdmin
    .from("coaches")
    .select("id,name,sports_category,location,created_at")
    .eq("is_approved", false)
    .eq("is_rejected", false)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Internal server error" });
  res.json((data ?? []).map((c: any) => ({ id: c.id, name: c.name, sportsCategory: c.sports_category, location: c.location, createdAt: new Date(c.created_at).toISOString() })));
});

router.get("/admin/reviews/all", async (req, res) => {
  if (!isAdminRequest(req)) return res.status(403).json({ error: "Forbidden" });
  const { data, error } = await supabaseAdmin.from("reviews").select("*").order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Internal server error" });
  res.json((data ?? []).map((r: any) => ({ ...r, createdAt: new Date(r.created_at).toISOString() })));
});

router.get("/admin/photos/pending", async (req, res) => {
  if (!isAdminRequest(req)) return res.status(403).json({ error: "Forbidden" });
  const { data, error } = await supabaseAdmin.from("photos").select("*").eq("is_approved", false).eq("is_rejected", false).order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Internal server error" });
  res.json((data ?? []).map((p: any) => ({ ...p, createdAt: new Date(p.created_at).toISOString() })));
});

router.get("/admin/posts/pending", async (req, res) => {
  if (!isAdminRequest(req)) return res.status(403).json({ error: "Forbidden" });
  const { data, error } = await supabaseAdmin.from("coach_posts").select("*").eq("is_approved", false).eq("is_rejected", false).order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Internal server error" });
  res.json((data ?? []).map((p: any) => ({ ...p, createdAt: new Date(p.created_at).toISOString() })));
});

router.get("/admin/reports", async (req, res) => {
  if (!isAdminRequest(req)) return res.status(403).json({ error: "Forbidden" });
  const { data, error } = await supabaseAdmin.from("reports").select("*").order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Internal server error" });
  res.json({ reports: (data ?? []).map((r: any) => ({ ...r, createdAt: new Date(r.created_at).toISOString() })) });
});

router.patch("/admin/reports/:id", async (req, res) => {
  if (!isAdminRequest(req)) return res.status(403).json({ error: "Forbidden" });
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid ID" });
  const status = typeof req.body?.status === "string" ? req.body.status : "resolved";
  const { error } = await supabaseAdmin.from("reports").update({ status }).eq("id", id);
  if (error) return res.status(500).json({ error: "Internal server error" });
  res.json({ ok: true });
});

router.post("/admin/reviews/:id/remove", async (req, res) => {
  if (!isAdminRequest(req)) return res.status(403).json({ error: "Forbidden" });
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid ID" });
  const removedReason = typeof req.body?.removedReason === "string" ? req.body.removedReason : "其他原因";
  let { error } = await supabaseAdmin
    .from("reviews")
    .update({ is_removed: true, removed_reason: removedReason, removed_at: new Date().toISOString(), removed_by: req.user?.id ?? null })
    .eq("id", id);
  if (error) {
    // Backward-compat fallback for environments missing soft-moderation columns.
    const fallback = await supabaseAdmin
      .from("reviews")
      .update({ comment: `removed by admin due to ${removedReason}` })
      .eq("id", id);
    error = fallback.error;
  }
  if (error) return res.status(500).json({ error: "Internal server error" });
  res.json({ ok: true });
});

router.post("/admin/reviews/:id/keep", async (req, res) => {
  if (!isAdminRequest(req)) return res.status(403).json({ error: "Forbidden" });
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid ID" });
  let { error } = await supabaseAdmin
    .from("reviews")
    .update({
      is_removed: false,
      // use removed_reason as lightweight reviewed marker for current schema
      removed_reason: "reviewed_keep",
      removed_at: null,
      removed_by: req.user?.id ?? null,
    })
    .eq("id", id);
  if (error) {
    // Backward-compat fallback for environments missing soft-moderation columns.
    const fallback = await supabaseAdmin
      .from("reviews")
      .update({ is_approved: true })
      .eq("id", id);
    error = fallback.error;
  }
  if (error) return res.status(500).json({ error: "Internal server error" });
  res.json({ ok: true });
});

router.patch("/admin/coaches/:id", async (req, res) => {
  if (!isAdminRequest(req)) return res.status(403).json({ error: "Forbidden" });
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid ID" });
  const b = req.body ?? {};
  const patch: Record<string, unknown> = {};
  if (b.qualifications !== undefined) patch.qualifications = b.qualifications;
  if (b.isProfessionalAthleteVerified !== undefined) patch.is_professional_athlete_verified = !!b.isProfessionalAthleteVerified;
  if (b.isLicensedCoachVerified !== undefined) patch.is_licensed_coach_verified = !!b.isLicensedCoachVerified;
  if (Object.keys(patch).length === 0) return res.status(400).json({ error: "No valid fields" });
  const { error } = await supabaseAdmin.from("coaches").update(patch).eq("id", id);
  if (error) return res.status(500).json({ error: "Internal server error" });
  res.json({ ok: true });
});

router.patch("/admin/coaches/:id/status", async (req, res) => {
  if (!isAdminRequest(req)) return res.status(403).json({ error: "Forbidden" });
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid ID" });
  const isApproved = !!req.body?.isApproved;
  const isRejected = !!req.body?.isRejected;
  const { error } = await supabaseAdmin.from("coaches").update({ is_approved: isApproved, is_rejected: isRejected }).eq("id", id);
  if (error) return res.status(500).json({ error: "Internal server error" });
  res.json({ ok: true });
});

router.post("/admin/coaches/:id/approve", async (req, res) => {
  if (!isAdminRequest(req)) return res.status(403).json({ error: "Forbidden" });
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid ID" });
  const { error } = await supabaseAdmin.from("coaches").update({ is_approved: true, is_rejected: false }).eq("id", id);
  if (error) return res.status(500).json({ error: "Internal server error" });
  res.json({ ok: true });
});

router.post("/admin/coaches/:id/reject", async (req, res) => {
  if (!isAdminRequest(req)) return res.status(403).json({ error: "Forbidden" });
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid ID" });
  const { error } = await supabaseAdmin.from("coaches").update({ is_approved: false, is_rejected: true }).eq("id", id);
  if (error) return res.status(500).json({ error: "Internal server error" });
  res.json({ ok: true });
});

router.patch("/admin/coaches/:id/featured", async (req, res) => {
  if (!isAdminRequest(req)) return res.status(403).json({ error: "Forbidden" });
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid ID" });
  const isFeatured = !!req.body?.isFeatured;
  const { error } = await supabaseAdmin.from("coaches").update({ is_featured: isFeatured }).eq("id", id);
  if (error) return res.status(500).json({ error: "Internal server error" });
  res.json({ ok: true });
});

router.patch("/admin/coaches/:id/youtube/approve", async (req, res) => {
  if (!isAdminRequest(req)) return res.status(403).json({ error: "Forbidden" });
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid ID" });
  const { data: coach } = await supabaseAdmin.from("coaches").select("youtube_pending").eq("id", id).maybeSingle();
  const { error } = await supabaseAdmin.from("coaches").update({ youtube_url: coach?.youtube_pending ?? null, youtube_pending: null }).eq("id", id);
  if (error) return res.status(500).json({ error: "Internal server error" });
  res.json({ ok: true });
});

router.patch("/admin/coaches/:id/youtube/reject", async (req, res) => {
  if (!isAdminRequest(req)) return res.status(403).json({ error: "Forbidden" });
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid ID" });
  const { error } = await supabaseAdmin.from("coaches").update({ youtube_pending: null }).eq("id", id);
  if (error) return res.status(500).json({ error: "Internal server error" });
  res.json({ ok: true });
});

router.post("/admin/photos/:id/approve", async (req, res) => {
  if (!isAdminRequest(req)) return res.status(403).json({ error: "Forbidden" });
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid ID" });
  const { error } = await supabaseAdmin.from("photos").update({ is_approved: true, is_rejected: false }).eq("id", id);
  if (error) return res.status(500).json({ error: "Internal server error" });
  res.json({ ok: true });
});

router.post("/admin/photos/:id/reject", async (req, res) => {
  if (!isAdminRequest(req)) return res.status(403).json({ error: "Forbidden" });
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid ID" });
  const { error } = await supabaseAdmin.from("photos").update({ is_approved: false, is_rejected: true }).eq("id", id);
  if (error) return res.status(500).json({ error: "Internal server error" });
  res.json({ ok: true });
});

router.put("/admin/posts/:id/approve", async (req, res) => {
  if (!isAdminRequest(req)) return res.status(403).json({ error: "Forbidden" });
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid ID" });
  const { error } = await supabaseAdmin.from("coach_posts").update({ is_approved: true, is_rejected: false }).eq("id", id);
  if (error) return res.status(500).json({ error: "Internal server error" });
  res.json({ ok: true });
});

router.put("/admin/posts/:id/reject", async (req, res) => {
  if (!isAdminRequest(req)) return res.status(403).json({ error: "Forbidden" });
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid ID" });
  const reason = typeof req.body?.reason === "string" ? req.body.reason : "rejected";
  const { error } = await supabaseAdmin.from("coach_posts").update({ is_approved: false, is_rejected: true, reject_reason: reason }).eq("id", id);
  if (error) return res.status(500).json({ error: "Internal server error" });
  res.json({ ok: true });
});

export default router;

