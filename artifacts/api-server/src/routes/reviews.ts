import { Router } from "express";
import { db } from "@workspace/db";
import { reviewsTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import { eq, and, desc } from "drizzle-orm";
import { CreateReviewBody } from "@workspace/api-zod";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const body = CreateReviewBody.parse(req.body);
    if (body.rating < 1 || body.rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const [review] = await db
      .insert(reviewsTable)
      .values({
        coachId: body.coachId,
        userId,
        userName: body.userName ?? null,
        rating: body.rating,
        comment: body.comment,
      })
      .returning();

    res.status(201).json({ ...review, createdAt: review.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "createReview error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/coach/:id", async (req, res) => {
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

export default router;
