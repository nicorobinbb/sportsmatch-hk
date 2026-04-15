import { Router } from "express";
import { db } from "@workspace/db";
import { coachesTable, reviewsTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";

function buildPricingPlans(
  pricingPlans: string | null | undefined,
  trialPrice: number,
  regularPrice: number
): string {
  if (pricingPlans) {
    try {
      const parsed = JSON.parse(pricingPlans);
      if (Array.isArray(parsed) && parsed.length > 0) return pricingPlans;
    } catch {}
  }
  const trial = Math.round(trialPrice);
  const regular = Math.round(regularPrice);
  if (trial > 0 && trial < regular) {
    return JSON.stringify([
      { sessionType: "單對單", price: String(trial) },
      { sessionType: "單對單", price: String(regular) },
    ]);
  }
  if (regular > 0) {
    return JSON.stringify([{ sessionType: "單對單", price: String(regular) }]);
  }
  return JSON.stringify([]);
}

const router = Router();

router.get("/", async (req, res) => {
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
        pricingPlans: coachesTable.pricingPlans,
        createdAt: coachesTable.createdAt,
        averageRating: sql<number | null>`AVG(${reviewsTable.rating})`,
        reviewCount: sql<number>`COUNT(DISTINCT ${reviewsTable.id})::int`,
      })
      .from(coachesTable)
      .leftJoin(
        reviewsTable,
        and(eq(reviewsTable.coachId, coachesTable.id), eq(reviewsTable.isApproved, true))
      )
      .where(and(eq(coachesTable.isApproved, true), eq(coachesTable.isFeatured, true)))
      .groupBy(coachesTable.id)
      .orderBy(desc(coachesTable.createdAt))
      .limit(6);

    res.json(
      coaches.map((c) => {
        const trialPrice = parseFloat(c.trialPrice as unknown as string);
        const regularPrice = parseFloat(c.regularPrice as unknown as string);
        return {
          ...c,
          trialPrice,
          regularPrice,
          pricingPlans: buildPricingPlans(c.pricingPlans, trialPrice, regularPrice),
          averageRating: c.averageRating ? parseFloat(c.averageRating as unknown as string) : null,
          reviewCount: c.reviewCount ?? 0,
          createdAt: c.createdAt.toISOString(),
        };
      })
    );
  } catch (err) {
    req.log.error({ err }, "listFeatured error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
