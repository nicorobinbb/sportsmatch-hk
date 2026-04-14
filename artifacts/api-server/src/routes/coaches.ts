import { Router } from "express";
import { db } from "@workspace/db";
import { coachesTable, reviewsTable, photosTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import { eq, and, desc, sql, ilike, or } from "drizzle-orm";
import { CreateCoachBody, ListCoachesQueryParams, CreateReviewBody, UploadCoachPhotoBody } from "@workspace/api-zod";

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
      conditions.push(
        or(
          ilike(coachesTable.name, `%${search}%`),
          ilike(coachesTable.sportsCategory, `%${search}%`),
          ilike(coachesTable.location, `%${search}%`)
        ) as ReturnType<typeof eq>
      );
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

export default router;
