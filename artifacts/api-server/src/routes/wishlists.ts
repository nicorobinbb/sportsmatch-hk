import { Router } from "express";
import { db } from "@workspace/db";
import { wishlistsTable, coachesTable, reviewsTable } from "@workspace/db";
import { eq, and, avg, count, inArray } from "drizzle-orm";
import { getAuth } from "../middlewares/supabaseAuthMiddleware.js";

const router = Router();

router.get("/", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const items = await db
    .select({ coachId: wishlistsTable.coachId, savedAt: wishlistsTable.createdAt })
    .from(wishlistsTable)
    .where(eq(wishlistsTable.userId, userId));

  if (items.length === 0) return res.json({ coaches: [] });

  const coachIds = items.map(i => i.coachId);

  const coaches = await db
    .select({
      id: coachesTable.id,
      name: coachesTable.name,
      sportsCategory: coachesTable.sportsCategory,
      location: coachesTable.location,
      bio: coachesTable.bio,
      trialPrice: coachesTable.trialPrice,
      regularPrice: coachesTable.regularPrice,
      profileImageUrl: coachesTable.profileImageUrl,
      experienceLevel: coachesTable.experienceLevel,
      whatsappNumber: coachesTable.whatsappNumber,
      averageRating: avg(reviewsTable.rating),
      reviewCount: count(reviewsTable.id),
    })
    .from(coachesTable)
    .leftJoin(reviewsTable, and(eq(reviewsTable.coachId, coachesTable.id), eq(reviewsTable.isApproved, true)))
    .where(inArray(coachesTable.id, coachIds))
    .groupBy(coachesTable.id);

  res.json({
    coaches: coaches.map(c => ({
      ...c,
      trialPrice: parseFloat(c.trialPrice as unknown as string),
      regularPrice: parseFloat(c.regularPrice as unknown as string),
      averageRating: c.averageRating ? parseFloat(c.averageRating as unknown as string) : null,
      reviewCount: Number(c.reviewCount),
      savedAt: items.find(i => i.coachId === c.id)?.savedAt,
    })),
  });
});

router.post("/:coachId", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const coachId = parseInt(req.params.coachId, 10);
  if (isNaN(coachId)) return res.status(400).json({ error: "Invalid coach ID" });

  const existing = await db.select().from(wishlistsTable)
    .where(and(eq(wishlistsTable.userId, userId), eq(wishlistsTable.coachId, coachId)));

  if (existing.length > 0) return res.json({ saved: true });

  await db.insert(wishlistsTable).values({ userId, coachId });
  res.json({ saved: true });
});

router.delete("/:coachId", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const coachId = parseInt(req.params.coachId, 10);
  if (isNaN(coachId)) return res.status(400).json({ error: "Invalid coach ID" });

  await db.delete(wishlistsTable)
    .where(and(eq(wishlistsTable.userId, userId), eq(wishlistsTable.coachId, coachId)));
  res.json({ saved: false });
});

router.get("/check/:coachId", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.json({ saved: false });
  const coachId = parseInt(req.params.coachId, 10);
  if (isNaN(coachId)) return res.status(400).json({ error: "Invalid coach ID" });

  const existing = await db.select().from(wishlistsTable)
    .where(and(eq(wishlistsTable.userId, userId), eq(wishlistsTable.coachId, coachId)));
  res.json({ saved: existing.length > 0 });
});

export default router;
