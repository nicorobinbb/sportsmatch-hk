import { Router } from "express";
import { db } from "@workspace/db";
import { coachesTable, reviewsTable, photosTable, reportsTable, userProfilesTable, wishlistsTable, coachPostsTable } from "@workspace/db";
import { getAuth } from "../middlewares/supabaseAuthMiddleware.js";
import { eq, sql, desc, count, ilike, or, and } from "drizzle-orm";

const router = Router();

function getAdminUserIds(): string[] {
  const raw = process.env.ADMIN_USER_IDS ?? "";
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  if (!auth?.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  (req as any).userId = auth.userId;
  next();
};

const requireAdmin = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  if (!auth?.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const adminIds = getAdminUserIds();
  if (!adminIds.includes(auth.userId)) {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }
  (req as any).userId = auth.userId;
  next();
};

// One-time backfill endpoint to populate teaching/sports achievements + pricing plans on coaches that don't have them.
function buildDefaultPricingPlans(opts: {
  regularPrice: number;
  trialPrice: number;
  ageGroups: string[] | null;
}) {
  const { regularPrice, trialPrice, ageGroups } = opts;
  const ag = (ageGroups && ageGroups.length > 0 ? ageGroups[0] : "成人（18歲以上）");
  const round10 = (n: number) => Math.max(80, Math.round(n / 10) * 10);
  const soloPrice = round10(regularPrice || trialPrice || 400);
  const groupPrice = round10(soloPrice * 0.55);
  return [
    {
      sessionType: "單對單",
      price: String(soloPrice),
      maxStudents: "1",
      duration: "60分鐘",
      ageGroup: ag,
    },
    {
      sessionType: "小組",
      price: String(groupPrice),
      minStudents: "3",
      maxStudents: "6",
      duration: "60分鐘",
      ageGroup: ag,
    },
  ];
}

router.post("/backfill-achievements", requireAdmin, async (_req, res) => {
  try {
    const allCoaches = await db
      .select({
        id: coachesTable.id,
        sport: coachesTable.sportsCategory,
        bio: coachesTable.bio,
        experienceLevel: coachesTable.experienceLevel,
        teaching: coachesTable.teachingAchievements,
        sports: coachesTable.sportsAchievements,
        teachingFocus: coachesTable.teachingFocus,
        ageGroups: coachesTable.ageGroups,
        trialPrice: coachesTable.trialPrice,
        regularPrice: coachesTable.regularPrice,
        pricingPlans: coachesTable.pricingPlans,
      })
      .from(coachesTable);

    let updated = 0;
    const competitiveRe = /競技|比賽|賽事|代表隊|甲組|港隊|冠軍|錦標|聯賽|備戰/;
    for (const c of allCoaches) {
      const isPro = (c.experienceLevel ?? "").includes("職業") || (c.experienceLevel ?? "").includes("專業");
      const teaching = c.teaching ??
        `執教${c.sport}超過5年，累計指導逾200名學員。曾任職本地學校及體育會教練，多位學員於校際及公開賽事中獲獎。教學風格因材施教，注重基本功及運動安全。`;
      const sports = c.sports ?? (isPro
        ? `前香港${c.sport}代表隊成員，曾參與多項國際及亞洲區賽事。本地公開賽多次獲得獎項，並擁有多年高水平比賽經驗。`
        : `本地${c.sport}愛好者及持證教練，曾參與多項本地賽事並取得不俗成績。持續進修以掌握最新的訓練方法及運動科學知識。`);

      const needsFocus = !c.teachingFocus || c.teachingFocus.length === 0;
      const focus = needsFocus
        ? (isPro || competitiveRe.test(c.bio ?? "") ? ["競賽", "興趣"] : ["興趣"])
        : c.teachingFocus;

      let needsPricing = false;
      let nextPricingPlans = c.pricingPlans;
      try {
        const parsed = c.pricingPlans ? JSON.parse(c.pricingPlans) : null;
        const hasGroup = Array.isArray(parsed) && parsed.some((p: any) => p?.sessionType === "小組");
        if (!Array.isArray(parsed) || parsed.length === 0 || !hasGroup) {
          needsPricing = true;
        }
      } catch {
        needsPricing = true;
      }
      if (needsPricing) {
        const plans = buildDefaultPricingPlans({
          regularPrice: parseFloat(c.regularPrice as unknown as string) || 0,
          trialPrice: parseFloat(c.trialPrice as unknown as string) || 0,
          ageGroups: c.ageGroups as string[] | null,
        });
        nextPricingPlans = JSON.stringify(plans);
      }

      if (
        c.teaching !== teaching ||
        c.sports !== sports ||
        needsFocus ||
        needsPricing
      ) {
        await db.update(coachesTable)
          .set({
            teachingAchievements: teaching,
            sportsAchievements: sports,
            teachingFocus: focus,
            pricingPlans: nextPricingPlans,
          })
          .where(eq(coachesTable.id, c.id));
        updated++;
      }
    }
    res.json({ success: true, total: allCoaches.length, updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/status", requireAuth, (req, res) => {
  const auth = getAuth(req);
  const adminIds = getAdminUserIds();
  const isAdmin = adminIds.includes(auth!.userId!);
  res.json({ isAdmin, userId: auth!.userId });
});

router.get("/coaches/pending", requireAdmin, async (req, res) => {
  try {
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
        isProfessionalAthleteVerified: coachesTable.isProfessionalAthleteVerified,
        isLicensedCoachVerified: coachesTable.isLicensedCoachVerified,
        isFeatured: coachesTable.isFeatured,
        isApproved: coachesTable.isApproved,
        profileImageUrl: coachesTable.profileImageUrl,
        createdAt: coachesTable.createdAt,
        averageRating: sql<null>`null`,
        reviewCount: sql<number>`0::int`,
      })
      .from(coachesTable)
      .where(and(eq(coachesTable.isApproved, false), eq(coachesTable.isRejected, false)));

    res.json(
      coaches.map((c) => ({
        ...c,
        trialPrice: parseFloat(c.trialPrice as unknown as string),
        regularPrice: parseFloat(c.regularPrice as unknown as string),
        averageRating: null,
        reviewCount: 0,
        createdAt: c.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "adminListPendingCoaches error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/coaches/:id/approve", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const [coach] = await db
      .update(coachesTable)
      .set({ isApproved: true, isRejected: false })
      .where(eq(coachesTable.id, id))
      .returning();

    if (!coach) return res.status(404).json({ error: "Not found" });
    res.json({
      ...coach,
      trialPrice: parseFloat(coach.trialPrice as unknown as string),
      regularPrice: parseFloat(coach.regularPrice as unknown as string),
      averageRating: null,
      reviewCount: 0,
      createdAt: coach.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "adminApproveCoach error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/coaches/:id/reject", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const [coach] = await db
      .update(coachesTable)
      .set({ isApproved: false, isRejected: true })
      .where(eq(coachesTable.id, id))
      .returning();

    if (!coach) return res.status(404).json({ error: "Not found" });
    res.json({
      ...coach,
      trialPrice: parseFloat(coach.trialPrice as unknown as string),
      regularPrice: parseFloat(coach.regularPrice as unknown as string),
      averageRating: null,
      reviewCount: 0,
      createdAt: coach.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "adminRejectCoach error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/reviews/pending", requireAdmin, async (req, res) => {
  try {
    const reviews = await db
      .select()
      .from(reviewsTable)
      .where(eq(reviewsTable.isApproved, false));

    res.json(reviews.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "adminListPendingReviews error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/reviews/all", requireAdmin, async (req, res) => {
  try {
    const reviews = await db
      .select()
      .from(reviewsTable)
      .orderBy(desc(reviewsTable.createdAt));

    res.json(
      reviews.map((r) => ({
        ...r,
        comment: r.isRemoved ? `removed by admin due to ${r.removedReason ?? "policy violation"}` : r.comment,
        createdAt: r.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "adminListAllReviews error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/reviews/:id/remove", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const reasonInput = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
    if (!reasonInput) return res.status(400).json({ error: "reason is required" });

    const [updated] = await db
      .update(reviewsTable)
      .set({
        isRemoved: true,
        removedReason: reasonInput,
        removedAt: new Date(),
        removedBy: (req as any).userId,
        isApproved: true,
      })
      .where(eq(reviewsTable.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json({
      ...updated,
      comment: `removed by admin due to ${updated.removedReason ?? "policy violation"}`,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "adminRemoveReview error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/reviews/:id/approve", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const [review] = await db
      .update(reviewsTable)
      .set({ isApproved: true })
      .where(eq(reviewsTable.id, id))
      .returning();

    if (!review) return res.status(404).json({ error: "Not found" });
    res.json({ ...review, createdAt: review.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "adminApproveReview error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/reviews/:id/reject", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const [review] = await db
      .delete(reviewsTable)
      .where(eq(reviewsTable.id, id))
      .returning();

    if (!review) return res.status(404).json({ error: "Not found" });
    res.json({ ...review, createdAt: review.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "adminRejectReview error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/photos/pending", requireAdmin, async (req, res) => {
  try {
    const photos = await db
      .select()
      .from(photosTable)
      .where(eq(photosTable.isApproved, false));

    res.json(photos.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "adminListPendingPhotos error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/photos/:id/approve", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const [photo] = await db
      .update(photosTable)
      .set({ isApproved: true })
      .where(eq(photosTable.id, id))
      .returning();

    if (!photo) return res.status(404).json({ error: "Not found" });
    res.json({ ...photo, createdAt: photo.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "adminApprovePhoto error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/photos/:id/reject", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const [photo] = await db
      .delete(photosTable)
      .where(eq(photosTable.id, id))
      .returning();

    if (!photo) return res.status(404).json({ error: "Not found" });
    res.json({ ...photo, createdAt: photo.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "adminRejectPhoto error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/coaches/all", requireAdmin, async (req, res) => {
  try {
    const search = (req.query.search as string) || "";
    const status = (req.query.status as string) || "all";

    let query = db
      .select({
        id: coachesTable.id,
        name: coachesTable.name,
        sportsCategory: coachesTable.sportsCategory,
        location: coachesTable.location,
        isApproved: coachesTable.isApproved,
        isRejected: coachesTable.isRejected,
        isFeatured: coachesTable.isFeatured,
        trialPrice: coachesTable.trialPrice,
        regularPrice: coachesTable.regularPrice,
        experienceLevel: coachesTable.experienceLevel,
        isProfessionalAthleteVerified: coachesTable.isProfessionalAthleteVerified,
        isLicensedCoachVerified: coachesTable.isLicensedCoachVerified,
        whatsappNumber: coachesTable.whatsappNumber,
        profileImageUrl: coachesTable.profileImageUrl,
        youtubeUrl: coachesTable.youtubeUrl,
        youtubePending: coachesTable.youtubePending,
        pendingEdits: coachesTable.pendingEdits,
        pricingPlans: coachesTable.pricingPlans,
        qualifications: coachesTable.qualifications,
        packageDetails: coachesTable.packageDetails,
        bio: coachesTable.bio,
        ageGroups: coachesTable.ageGroups,
        teachingAchievements: coachesTable.teachingAchievements,
        sportsAchievements: coachesTable.sportsAchievements,
        createdAt: coachesTable.createdAt,
      })
      .from(coachesTable)
      .$dynamic();

    if (search) {
      query = query.where(
        or(
          ilike(coachesTable.name, `%${search}%`),
          ilike(coachesTable.sportsCategory, `%${search}%`),
          ilike(coachesTable.location, `%${search}%`)
        )
      );
    } else if (status === "active") {
      query = query.where(eq(coachesTable.isApproved, true));
    } else if (status === "inactive") {
      query = query.where(and(eq(coachesTable.isApproved, false), eq(coachesTable.isRejected, false)));
    } else if (status === "rejected") {
      query = query.where(eq(coachesTable.isRejected, true));
    }

    const coaches = await query.orderBy(desc(coachesTable.createdAt));

    res.json({
      coaches: coaches.map(c => ({
        ...c,
        trialPrice: parseFloat(c.trialPrice as unknown as string),
        regularPrice: parseFloat(c.regularPrice as unknown as string),
        createdAt: c.createdAt.toISOString(),
      }))
    });
  } catch (err) {
    req.log.error({ err }, "adminListAllCoaches error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/coaches/:id/status", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const { isApproved } = req.body;
    if (typeof isApproved !== "boolean") return res.status(400).json({ error: "isApproved must be boolean" });

    const [updated] = await db
      .update(coachesTable)
      .set({ isApproved })
      .where(eq(coachesTable.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: "Coach not found" });

    res.json({
      coach: {
        ...updated,
        trialPrice: parseFloat(updated.trialPrice as unknown as string),
        regularPrice: parseFloat(updated.regularPrice as unknown as string),
        createdAt: updated.createdAt.toISOString(),
      }
    });
  } catch (err) {
    req.log.error({ err }, "adminUpdateCoachStatus error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/coaches/:id/featured", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const { isFeatured } = req.body;
    if (typeof isFeatured !== "boolean") return res.status(400).json({ error: "isFeatured must be boolean" });

    const [updated] = await db
      .update(coachesTable)
      .set({ isFeatured })
      .where(eq(coachesTable.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: "Coach not found" });
    res.json({ coach: { id: updated.id, isFeatured: updated.isFeatured } });
  } catch (err) {
    req.log.error({ err }, "adminUpdateCoachFeatured error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/coaches/:id/edits/approve", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const [coach] = await db.select().from(coachesTable).where(eq(coachesTable.id, id));
    if (!coach) return res.status(404).json({ error: "Coach not found" });
    if (!coach.pendingEdits) return res.status(400).json({ error: "No pending edits" });

    let edits: Record<string, unknown>;
    try { edits = JSON.parse(coach.pendingEdits); } catch { return res.status(400).json({ error: "Invalid pending edits" }); }

    const updateData: Record<string, unknown> = { pendingEdits: null };
    if (edits.name !== undefined) updateData.name = edits.name;
    if (edits.sportsCategory !== undefined) updateData.sportsCategory = edits.sportsCategory;
    if (edits.location !== undefined) updateData.location = edits.location;
    if (edits.bio !== undefined) updateData.bio = edits.bio;
    if (edits.trialPrice !== undefined) updateData.trialPrice = String(edits.trialPrice);
    if (edits.regularPrice !== undefined) updateData.regularPrice = String(edits.regularPrice);
    if (edits.packageDetails !== undefined) updateData.packageDetails = edits.packageDetails;
    if (edits.ageGroups !== undefined) updateData.ageGroups = edits.ageGroups;
    if (edits.experienceLevel !== undefined) updateData.experienceLevel = edits.experienceLevel;
    if (edits.whatsappNumber !== undefined) updateData.whatsappNumber = edits.whatsappNumber;
    if (edits.profileImageUrl !== undefined) updateData.profileImageUrl = edits.profileImageUrl;

    const [updated] = await db.update(coachesTable).set(updateData as any).where(eq(coachesTable.id, id)).returning();
    res.json({ coach: { ...updated, trialPrice: parseFloat(updated.trialPrice as unknown as string), regularPrice: parseFloat(updated.regularPrice as unknown as string) } });
  } catch (err) {
    req.log.error({ err }, "adminApproveEdits error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/coaches/:id/edits/reject", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const [updated] = await db.update(coachesTable).set({ pendingEdits: null }).where(eq(coachesTable.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "Coach not found" });
    res.json({ pendingEdits: null });
  } catch (err) {
    req.log.error({ err }, "adminRejectEdits error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/coaches/:id/youtube/approve", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const [coach] = await db.select({ youtubePending: coachesTable.youtubePending }).from(coachesTable).where(eq(coachesTable.id, id));
    if (!coach) return res.status(404).json({ error: "Coach not found" });
    if (!coach.youtubePending) return res.status(400).json({ error: "No pending YouTube URL" });

    const [updated] = await db
      .update(coachesTable)
      .set({ youtubeUrl: coach.youtubePending, youtubePending: null })
      .where(eq(coachesTable.id, id))
      .returning();

    res.json({ youtubeUrl: updated.youtubeUrl, youtubePending: updated.youtubePending });
  } catch (err) {
    req.log.error({ err }, "adminApproveYoutube error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/coaches/:id/youtube/reject", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const [updated] = await db
      .update(coachesTable)
      .set({ youtubePending: null })
      .where(eq(coachesTable.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: "Coach not found" });
    res.json({ youtubePending: null });
  } catch (err) {
    req.log.error({ err }, "adminRejectYoutube error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/coaches/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const {
      name, sportsCategory, location, bio,
      trialPrice, regularPrice, experienceLevel,
      isProfessionalAthleteVerified, isLicensedCoachVerified,
      whatsappNumber, packageDetails, ageGroups,
      pricingPlans, qualifications,
    } = req.body;

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = String(name).trim();
    if (sportsCategory !== undefined) updates.sportsCategory = String(sportsCategory).trim();
    if (location !== undefined) updates.location = String(location).trim();
    if (bio !== undefined) updates.bio = String(bio).trim();
    if (trialPrice !== undefined) updates.trialPrice = parseFloat(trialPrice);
    if (regularPrice !== undefined) updates.regularPrice = parseFloat(regularPrice);
    if (experienceLevel !== undefined) updates.experienceLevel = String(experienceLevel).trim();
    if (isProfessionalAthleteVerified !== undefined) updates.isProfessionalAthleteVerified = !!isProfessionalAthleteVerified;
    if (isLicensedCoachVerified !== undefined) updates.isLicensedCoachVerified = !!isLicensedCoachVerified;
    if (whatsappNumber !== undefined) updates.whatsappNumber = String(whatsappNumber).trim();
    if (packageDetails !== undefined) updates.packageDetails = String(packageDetails).trim();
    if (ageGroups !== undefined) updates.ageGroups = ageGroups;
    if (pricingPlans !== undefined) updates.pricingPlans = typeof pricingPlans === "string" ? pricingPlans : JSON.stringify(pricingPlans);
    if (qualifications !== undefined) updates.qualifications = typeof qualifications === "string" ? qualifications : JSON.stringify(qualifications);

    const [updated] = await db
      .update(coachesTable)
      .set(updates)
      .where(eq(coachesTable.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: "Coach not found" });
    res.json({
      coach: {
        ...updated,
        trialPrice: parseFloat(updated.trialPrice as unknown as string),
        regularPrice: parseFloat(updated.regularPrice as unknown as string),
        createdAt: updated.createdAt.toISOString(),
      }
    });
  } catch (err) {
    req.log.error({ err }, "adminUpdateCoach error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/analytics", requireAdmin, async (req, res) => {
  try {
    const sportsCounts = await db
      .select({ sport: coachesTable.sportsCategory, count: count() })
      .from(coachesTable)
      .where(eq(coachesTable.isApproved, true))
      .groupBy(coachesTable.sportsCategory)
      .orderBy(desc(count()));

    const districtCounts = await db
      .select({ district: coachesTable.location, count: count() })
      .from(coachesTable)
      .where(eq(coachesTable.isApproved, true))
      .groupBy(coachesTable.location)
      .orderBy(desc(count()));

    const totalCoaches = await db.select({ count: count() }).from(coachesTable).where(eq(coachesTable.isApproved, true));
    const totalReviews = await db.select({ count: count() }).from(reviewsTable).where(eq(reviewsTable.isApproved, true));
    const pendingReports = await db.select({ count: count() }).from(reportsTable).where(eq(reportsTable.status, "pending"));

    res.json({
      sportsCounts: sportsCounts.map(r => ({ sport: r.sport, count: Number(r.count) })),
      districtCounts: districtCounts.map(r => ({ district: r.district, count: Number(r.count) })),
      totalCoaches: Number(totalCoaches[0]?.count ?? 0),
      totalReviews: Number(totalReviews[0]?.count ?? 0),
      pendingReports: Number(pendingReports[0]?.count ?? 0),
    });
  } catch (err) {
    req.log.error({ err }, "adminAnalytics error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/user-profiles", requireAdmin, async (req, res) => {
  try {
    const profiles = await db
      .select()
      .from(userProfilesTable)
      .orderBy(desc(userProfilesTable.createdAt));

    res.json({
      profiles: profiles.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }))
    });
  } catch (err) {
    req.log.error({ err }, "adminUserProfiles error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/user-analytics", requireAdmin, async (req, res) => {
  try {
    const totalUsers = await db.select({ count: count() }).from(userProfilesTable);
    const onboardedUsers = await db.select({ count: count() }).from(userProfilesTable)
      .where(eq(userProfilesTable.onboardingCompleted, true));
    const totalWishlists = await db.select({ count: count() }).from(wishlistsTable);

    const topWishlistedCoaches = await db
      .select({
        coachId: wishlistsTable.coachId,
        coachName: coachesTable.name,
        sport: coachesTable.sportsCategory,
        saves: count(),
      })
      .from(wishlistsTable)
      .leftJoin(coachesTable, eq(wishlistsTable.coachId, coachesTable.id))
      .groupBy(wishlistsTable.coachId, coachesTable.name, coachesTable.sportsCategory)
      .orderBy(desc(count()))
      .limit(10);

    const allProfiles = await db
      .select({ preferredSports: userProfilesTable.preferredSports, goals: userProfilesTable.goals, preferredDistricts: userProfilesTable.preferredDistricts })
      .from(userProfilesTable)
      .where(eq(userProfilesTable.onboardingCompleted, true));

    const sportCounts: Record<string, number> = {};
    const goalCounts: Record<string, number> = {};
    const districtCounts: Record<string, number> = {};

    for (const p of allProfiles) {
      for (const s of p.preferredSports || []) sportCounts[s] = (sportCounts[s] || 0) + 1;
      for (const g of p.goals || []) goalCounts[g] = (goalCounts[g] || 0) + 1;
      for (const d of p.preferredDistricts || []) districtCounts[d] = (districtCounts[d] || 0) + 1;
    }

    const toRanked = (obj: Record<string, number>) =>
      Object.entries(obj).sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }));

    res.json({
      totalUsers: Number(totalUsers[0]?.count ?? 0),
      onboardedUsers: Number(onboardedUsers[0]?.count ?? 0),
      totalWishlists: Number(totalWishlists[0]?.count ?? 0),
      topWishlistedCoaches: topWishlistedCoaches.map(r => ({ ...r, saves: Number(r.saves) })),
      topSports: toRanked(sportCounts),
      topGoals: toRanked(goalCounts),
      topDistricts: toRanked(districtCounts),
    });
  } catch (err) {
    req.log.error({ err }, "adminUserAnalytics error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/reports", requireAdmin, async (req, res) => {
  try {
    const reports = await db
      .select({
        id: reportsTable.id,
        userId: reportsTable.userId,
        coachId: reportsTable.coachId,
        coachName: coachesTable.name,
        reason: reportsTable.reason,
        description: reportsTable.description,
        status: reportsTable.status,
        adminNote: reportsTable.adminNote,
        createdAt: reportsTable.createdAt,
      })
      .from(reportsTable)
      .leftJoin(coachesTable, eq(reportsTable.coachId, coachesTable.id))
      .orderBy(desc(reportsTable.createdAt));

    res.json({ reports: reports.map(r => ({ ...r, createdAt: r.createdAt?.toISOString() })) });
  } catch (err) {
    req.log.error({ err }, "adminListReports error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/reports/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const { status, adminNote } = req.body;
    const [updated] = await db.update(reportsTable)
      .set({ status, adminNote })
      .where(eq(reportsTable.id, id))
      .returning();
    res.json({ report: { ...updated, createdAt: updated.createdAt.toISOString() } });
  } catch (err) {
    req.log.error({ err }, "adminUpdateReport error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- Coach Posts ---

router.get("/posts/pending", requireAdmin, async (req, res) => {
  try {
    const posts = await db
      .select({
        id: coachPostsTable.id,
        coachId: coachPostsTable.coachId,
        caption: coachPostsTable.caption,
        mediaUrls: coachPostsTable.mediaUrls,
        youtubeUrl: coachPostsTable.youtubeUrl,
        isApproved: coachPostsTable.isApproved,
        isRejected: coachPostsTable.isRejected,
        rejectionReason: coachPostsTable.rejectionReason,
        createdAt: coachPostsTable.createdAt,
        coachName: coachesTable.name,
        coachSport: coachesTable.sportsCategory,
      })
      .from(coachPostsTable)
      .leftJoin(coachesTable, eq(coachPostsTable.coachId, coachesTable.id))
      .where(and(eq(coachPostsTable.isApproved, false), eq(coachPostsTable.isRejected, false)))
      .orderBy(desc(coachPostsTable.createdAt));

    res.json(posts.map(p => ({ ...p, createdAt: p.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "adminGetPendingPosts error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/posts/:id/approve", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const [updated] = await db.update(coachPostsTable)
      .set({ isApproved: true, isRejected: false, rejectionReason: null })
      .where(eq(coachPostsTable.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "adminApprovePost error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/posts/:id/reject", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const { reason } = req.body;
    const [updated] = await db.update(coachPostsTable)
      .set({ isRejected: true, isApproved: false, rejectionReason: reason || null })
      .where(eq(coachPostsTable.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "adminRejectPost error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
