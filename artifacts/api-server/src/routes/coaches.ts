import { Router } from "express";
import { db } from "@workspace/db";
import { coachesTable, reviewsTable, photosTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import { eq, and, desc, sql, ilike, or } from "drizzle-orm";
import { CreateCoachBody, ListCoachesQueryParams, CreateReviewBody, UploadCoachPhotoBody } from "@workspace/api-zod";

const EN_TO_ZH: Record<string, string[]> = {
  swimming: ["游泳"],
  swim: ["游泳"],
  yoga: ["瑜伽"],
  basketball: ["籃球"],
  tennis: ["網球"],
  boxing: ["拳擊"],
  box: ["拳擊"],
  pilates: ["普拉提"],
  football: ["足球"],
  soccer: ["足球"],
  badminton: ["羽毛球"],
  running: ["跑步"],
  run: ["跑步"],
  jogging: ["跑步"],
  jog: ["跑步"],
  marathon: ["跑步"],
  dance: ["舞蹈"],
  dancing: ["舞蹈"],
  golf: ["高爾夫球"],
  "table tennis": ["乒乓球"],
  "ping pong": ["乒乓球"],
  pingpong: ["乒乓球"],
  gymnastics: ["體操"],
  gymnastic: ["體操"],
  taekwondo: ["跆拳道"],
  tae: ["跆拳道"],
  karate: ["空手道"],
  volleyball: ["排球"],
  fencing: ["劍擊"],
  "personal training": ["個人訓練"],
  "personal trainer": ["個人訓練"],
  fitness: ["個人訓練"],
  gym: ["個人訓練"],
  pt: ["個人訓練"],
  athletics: ["田徑"],
  track: ["田徑"],
  "track and field": ["田徑"],
  sprinting: ["田徑"],
  sprint: ["田徑"],
  hurdles: ["田徑"],
  "long jump": ["田徑"],
  "high jump": ["田徑"],
  javelin: ["田徑"],
  discus: ["田徑"],
  central: ["中環"],
  "wan chai": ["灣仔"],
  wanchai: ["灣仔"],
  "causeway bay": ["銅鑼灣"],
  "north point": ["北角"],
  "quarry bay": ["鰂魚涌"],
  shaukeiwan: ["筲箕灣"],
  aberdeen: ["香港仔"],
  "happy valley": ["跑馬地"],
  "tsim sha tsui": ["尖沙咀"],
  tst: ["尖沙咀"],
  jordan: ["佐敦"],
  "mong kok": ["旺角"],
  mongkok: ["旺角"],
  "sham shui po": ["深水埗"],
  "kowloon city": ["九龍城"],
  "kowloon tong": ["九龍塘"],
  "kwun tong": ["觀塘"],
  "sha tin": ["沙田"],
  shatin: ["沙田"],
  "tai wai": ["大圍"],
  taiwai: ["大圍"],
  "ma on shan": ["馬鞍山"],
  maonshan: ["馬鞍山"],
  "tai po": ["大埔"],
  taipo: ["大埔"],
  "sheung shui": ["上水"],
  fanling: ["粉嶺"],
  "yuen long": ["元朗"],
  yuenlong: ["元朗"],
  "tuen mun": ["屯門"],
  tuenmun: ["屯門"],
  "tsuen wan": ["荃灣"],
  tsuenwan: ["荃灣"],
  "kwai chung": ["葵涌"],
  "tsing yi": ["青衣"],
  "tseung kwan o": ["將軍澳"],
  tko: ["將軍澳"],
  "sai kung": ["西貢"],
  saikung: ["西貢"],
  "tin shui wai": ["天水圍"],
  "deep water bay": ["深水灣"],
  "lai chi kok": ["荔枝角"],
  "lok fu": ["樂富"],
  "rainbow": ["彩虹"],
  "san po kong": ["新蒲崗"],
  "kowloon bay": ["九龍灣"],
  "wong tai sin": ["黃大仙"],
  "to kwa wan": ["土瓜灶"],
  "hung hom": ["紅磡"],
  "ho man tin": ["何文田"],
  "west kowloon": ["西九龍"],
  "sham shui": ["深水埗"],
};

function expandSearch(term: string): string[] {
  const lower = term.toLowerCase().trim();
  const results = new Set<string>([term]);
  for (const [en, zhList] of Object.entries(EN_TO_ZH)) {
    if (lower.includes(en) || en.includes(lower)) {
      zhList.forEach((zh) => results.add(zh));
    }
  }
  return Array.from(results);
}

const router = Router();

router.get("/", async (req, res) => {
  try {
    const query = ListCoachesQueryParams.parse(req.query);
    const { sport, location, search, limit = 50, offset = 0 } = query;

    const conditions: ReturnType<typeof eq>[] = [eq(coachesTable.isApproved, true)];

    if (sport) {
      conditions.push(eq(coachesTable.sportsCategory, sport));
    }
    if (location) {
      conditions.push(ilike(coachesTable.location, `%${location}%`));
    }
    if (search) {
      const terms = expandSearch(search);
      const searchClauses = terms.flatMap((term) => [
        ilike(coachesTable.name, `%${term}%`),
        ilike(coachesTable.sportsCategory, `%${term}%`),
        ilike(coachesTable.location, `%${term}%`),
        ilike(coachesTable.bio, `%${term}%`),
      ]);
      conditions.push(or(...searchClauses) as ReturnType<typeof eq>);
    }

    const coaches = await db
      .select({
        id: coachesTable.id,
        userId: coachesTable.userId,
        name: coachesTable.name,
        sportsCategory: coachesTable.sportsCategory,
        location: coachesTable.location,
        bio: coachesTable.bio,
        trialPrice: coachesTable.trialPrice,
        regularPrice: coachesTable.regularPrice,
        packageDetails: coachesTable.packageDetails,
        ageGroups: coachesTable.ageGroups,
        experienceLevel: coachesTable.experienceLevel,
        isFeatured: coachesTable.isFeatured,
        isApproved: coachesTable.isApproved,
        profileImageUrl: coachesTable.profileImageUrl,
        createdAt: coachesTable.createdAt,
        averageRating: sql<number | null>`AVG(${reviewsTable.rating})`,
        reviewCount: sql<number>`COUNT(DISTINCT ${reviewsTable.id})::int`,
      })
      .from(coachesTable)
      .leftJoin(
        reviewsTable,
        and(eq(reviewsTable.coachId, coachesTable.id), eq(reviewsTable.isApproved, true))
      )
      .where(and(...conditions))
      .groupBy(coachesTable.id)
      .orderBy(desc(coachesTable.isFeatured), desc(coachesTable.createdAt))
      .limit(limit)
      .offset(offset);

    const total = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(coachesTable)
      .where(and(...conditions));

    const mapped = coaches.map((c) => ({
      ...c,
      trialPrice: parseFloat(c.trialPrice as unknown as string),
      regularPrice: parseFloat(c.regularPrice as unknown as string),
      averageRating: c.averageRating ? parseFloat(c.averageRating as unknown as string) : null,
      reviewCount: c.reviewCount ?? 0,
      createdAt: c.createdAt.toISOString(),
    }));

    res.json({ coaches: mapped, total: total[0]?.count ?? 0 });
  } catch (err) {
    req.log.error({ err }, "listCoaches error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const body = CreateCoachBody.parse(req.body);

    const [coach] = await db
      .insert(coachesTable)
      .values({
        userId,
        name: body.name,
        sportsCategory: body.sportsCategory,
        location: body.location,
        bio: body.bio,
        trialPrice: String(body.trialPrice),
        regularPrice: String(body.regularPrice),
        packageDetails: body.packageDetails ?? null,
        ageGroups: body.ageGroups,
        experienceLevel: body.experienceLevel,
        profileImageUrl: body.profileImageUrl ?? null,
        whatsappNumber: body.whatsappNumber ?? null,
        qualifications: (body as any).qualifications ?? null,
        qualificationProofUrl: (body as any).qualificationProofUrl ?? null,
        pricingPlans: (body as any).pricingPlans ?? null,
      })
      .returning();

    res.status(201).json({
      ...coach,
      trialPrice: parseFloat(coach.trialPrice as unknown as string),
      regularPrice: parseFloat(coach.regularPrice as unknown as string),
      averageRating: null,
      reviewCount: 0,
      createdAt: coach.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "createCoach error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/stats/summary", async (req, res) => {
  try {
    const [totalCoachesResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(coachesTable)
      .where(eq(coachesTable.isApproved, true));

    const [totalReviewsResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(reviewsTable)
      .where(eq(reviewsTable.isApproved, true));

    const categoriesResult = await db
      .select({ sportsCategory: coachesTable.sportsCategory })
      .from(coachesTable)
      .where(eq(coachesTable.isApproved, true))
      .groupBy(coachesTable.sportsCategory);

    const [featuredResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(coachesTable)
      .where(and(eq(coachesTable.isApproved, true), eq(coachesTable.isFeatured, true)));

    res.json({
      totalCoaches: totalCoachesResult?.count ?? 0,
      totalReviews: totalReviewsResult?.count ?? 0,
      totalCategories: categoriesResult.length,
      featuredCount: featuredResult?.count ?? 0,
    });
  } catch (err) {
    req.log.error({ err }, "getCoachStats error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) return res.status(401).json({ error: "Unauthorized" });

    const coaches = await db
      .select()
      .from(coachesTable)
      .where(eq(coachesTable.userId, auth.userId))
      .orderBy(desc(coachesTable.createdAt));

    res.json({
      coaches: coaches.map(c => ({
        ...c,
        trialPrice: parseFloat(c.trialPrice as unknown as string),
        regularPrice: parseFloat(c.regularPrice as unknown as string),
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      }))
    });
  } catch (err) {
    req.log.error({ err }, "getMyCoaches error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const [coach] = await db
      .select({
        id: coachesTable.id,
        userId: coachesTable.userId,
        name: coachesTable.name,
        sportsCategory: coachesTable.sportsCategory,
        location: coachesTable.location,
        bio: coachesTable.bio,
        trialPrice: coachesTable.trialPrice,
        regularPrice: coachesTable.regularPrice,
        packageDetails: coachesTable.packageDetails,
        ageGroups: coachesTable.ageGroups,
        experienceLevel: coachesTable.experienceLevel,
        isFeatured: coachesTable.isFeatured,
        isApproved: coachesTable.isApproved,
        profileImageUrl: coachesTable.profileImageUrl,
        whatsappNumber: coachesTable.whatsappNumber,
        youtubeUrl: coachesTable.youtubeUrl,
        youtubePending: coachesTable.youtubePending,
        createdAt: coachesTable.createdAt,
        averageRating: sql<number | null>`AVG(${reviewsTable.rating})`,
        reviewCount: sql<number>`COUNT(DISTINCT ${reviewsTable.id})::int`,
      })
      .from(coachesTable)
      .leftJoin(
        reviewsTable,
        and(eq(reviewsTable.coachId, coachesTable.id), eq(reviewsTable.isApproved, true))
      )
      .where(eq(coachesTable.id, id))
      .groupBy(coachesTable.id);

    if (!coach) return res.status(404).json({ error: "Coach not found" });

    const reviews = await db
      .select()
      .from(reviewsTable)
      .where(and(eq(reviewsTable.coachId, id), eq(reviewsTable.isApproved, true)))
      .orderBy(desc(reviewsTable.createdAt));

    const photos = await db
      .select()
      .from(photosTable)
      .where(and(eq(photosTable.coachId, id), eq(photosTable.isApproved, true)));

    res.json({
      ...coach,
      trialPrice: parseFloat(coach.trialPrice as unknown as string),
      regularPrice: parseFloat(coach.regularPrice as unknown as string),
      averageRating: coach.averageRating ? parseFloat(coach.averageRating as unknown as string) : null,
      reviewCount: coach.reviewCount ?? 0,
      createdAt: coach.createdAt.toISOString(),
      reviews: reviews.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
      photos: photos.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })),
    });
  } catch (err) {
    req.log.error({ err }, "getCoach error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/boost", async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) return res.status(401).json({ error: "Unauthorized" });
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    res.json({
      checkoutUrl: null,
      message: "Stripe Boost coming soon! Your profile will be featured once payment is enabled.",
    });
  } catch (err) {
    req.log.error({ err }, "boostCoach error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/reviews", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const reviews = await db
      .select()
      .from(reviewsTable)
      .where(and(eq(reviewsTable.coachId, id), eq(reviewsTable.isApproved, true)))
      .orderBy(desc(reviewsTable.createdAt));

    res.json(reviews.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "getCoachReviews error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/photos", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const photos = await db
      .select()
      .from(photosTable)
      .where(and(eq(photosTable.coachId, id), eq(photosTable.isApproved, true)));

    res.json(photos.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "getCoachPhotos error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/photos", async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) return res.status(401).json({ error: "Unauthorized" });

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const body = UploadCoachPhotoBody.parse(req.body);

    const [photo] = await db
      .insert(photosTable)
      .values({ coachId: id, imageUrl: body.imageUrl })
      .returning();

    res.status(201).json({ ...photo, createdAt: photo.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "uploadCoachPhoto error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id/edit-request", async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) return res.status(401).json({ error: "Unauthorized" });

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const [coach] = await db.select({ userId: coachesTable.userId }).from(coachesTable).where(eq(coachesTable.id, id));
    if (!coach) return res.status(404).json({ error: "Coach not found" });
    if (coach.userId !== auth.userId) return res.status(403).json({ error: "Forbidden" });

    const allowed = ["name", "sportsCategory", "location", "bio", "trialPrice", "regularPrice", "packageDetails", "ageGroups", "experienceLevel", "whatsappNumber", "profileImageUrl", "qualifications", "qualificationProofUrl", "pricingPlans"];
    const edits: Record<string, unknown> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) edits[key] = req.body[key];
    }
    if (Object.keys(edits).length === 0) return res.status(400).json({ error: "No changes provided" });

    const [updated] = await db
      .update(coachesTable)
      .set({ pendingEdits: JSON.stringify(edits) })
      .where(eq(coachesTable.id, id))
      .returning();

    res.json({ pendingEdits: updated.pendingEdits });
  } catch (err) {
    req.log.error({ err }, "submitEditRequest error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id/youtube", async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) return res.status(401).json({ error: "Unauthorized" });

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const { youtubeUrl } = req.body;

    const [coach] = await db.select({ userId: coachesTable.userId }).from(coachesTable).where(eq(coachesTable.id, id));
    if (!coach) return res.status(404).json({ error: "Coach not found" });
    if (coach.userId !== auth.userId) return res.status(403).json({ error: "Forbidden" });

    if (youtubeUrl && typeof youtubeUrl === "string") {
      const ytRegex = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
      if (!ytRegex.test(youtubeUrl.trim())) {
        return res.status(400).json({ error: "請輸入有效的 YouTube 連結" });
      }
    }

    const [updated] = await db
      .update(coachesTable)
      .set({ youtubePending: youtubeUrl ? youtubeUrl.trim() : null })
      .where(eq(coachesTable.id, id))
      .returning();

    res.json({ youtubePending: updated.youtubePending });
  } catch (err) {
    req.log.error({ err }, "submitYoutubeUrl error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
