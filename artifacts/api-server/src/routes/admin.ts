import { Router } from "express";
import { db } from "@workspace/db";
import { coachesTable, reviewsTable, photosTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import { eq, and, sql } from "drizzle-orm";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  if (!auth?.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  (req as any).userId = auth.userId;
  next();
};

router.get("/coaches/pending", requireAuth, async (req, res) => {
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
        isFeatured: coachesTable.isFeatured,
        isApproved: coachesTable.isApproved,
        profileImageUrl: coachesTable.profileImageUrl,
        createdAt: coachesTable.createdAt,
        averageRating: sql<null>`null`,
        reviewCount: sql<number>`0::int`,
      })
      .from(coachesTable)
      .where(eq(coachesTable.isApproved, false));

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

router.post("/coaches/:id/approve", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const [coach] = await db
      .update(coachesTable)
      .set({ isApproved: true })
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

router.post("/coaches/:id/reject", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const [coach] = await db
      .delete(coachesTable)
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

router.get("/reviews/pending", requireAuth, async (req, res) => {
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

router.post("/reviews/:id/approve", requireAuth, async (req, res) => {
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

router.post("/reviews/:id/reject", requireAuth, async (req, res) => {
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

router.get("/photos/pending", requireAuth, async (req, res) => {
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

router.post("/photos/:id/approve", requireAuth, async (req, res) => {
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

router.post("/photos/:id/reject", requireAuth, async (req, res) => {
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

export default router;
