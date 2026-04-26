import { Router } from "express";
import { db } from "@workspace/db";
import { reviewsTable, coachesTable } from "@workspace/db";
import { getAuth } from "../middlewares/supabaseAuthMiddleware.js";
import { eq, and, desc } from "drizzle-orm";
import { CreateReviewBody } from "@workspace/api-zod";

const router = Router();
const MAX_REVIEW_LENGTH = 1200;
const REVIEW_CREATE_LIMIT_WINDOW_MS = 60_000;
const REVIEW_CREATE_LIMIT_COUNT = 8;
const reviewCreateCounter = new Map<string, { count: number; startedAt: number }>();

function checkReviewCreateRateLimit(userId: string): boolean {
  const now = Date.now();
  const current = reviewCreateCounter.get(userId);
  if (!current || now - current.startedAt > REVIEW_CREATE_LIMIT_WINDOW_MS) {
    reviewCreateCounter.set(userId, { count: 1, startedAt: now });
    return true;
  }
  if (current.count >= REVIEW_CREATE_LIMIT_COUNT) return false;
  current.count += 1;
  reviewCreateCounter.set(userId, current);
  return true;
}

function detectReviewViolation(comment: string): string | null {
  const normalized = comment.toLowerCase();
  const checks: Array<{ reason: string; patterns: RegExp[] }> = [
    {
      reason: "violence",
      patterns: [/殺/, /打死/, /斬/, /暴力/, /violence/, /kill/, /attack/],
    },
    {
      reason: "sexist content",
      patterns: [/性別歧視/, /女人就應該/, /男人就應該/, /sexist/, /misogyn/i],
    },
    {
      reason: "unrelated advertising",
      patterns: [/加我whatsapp/, /加我wechat/, /買一送一/, /優惠碼/, /discount code/, /promo/, /http:\/\/|https:\/\//],
    },
    {
      reason: "unrelated content",
      patterns: [/賭博/, /博彩/, /loan/, /貸款/, /crypto/, /代購/],
    },
  ];

  for (const group of checks) {
    if (group.patterns.some((re) => re.test(normalized) || re.test(comment))) {
      return group.reason;
    }
  }
  return null;
}

function toReviewResponse(review: typeof reviewsTable.$inferSelect) {
  const isRemoved = !!review.isRemoved;
  const removedReason = review.removedReason ?? "policy violation";
  return {
    ...review,
    comment: isRemoved ? `removed by admin due to ${removedReason}` : review.comment,
    replyAt: review.replyAt ? review.replyAt.toISOString() : null,
    createdAt: review.createdAt.toISOString(),
  };
}

router.post("/", async (req, res) => {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const body = CreateReviewBody.parse(req.body);
    if (!checkReviewCreateRateLimit(userId)) {
      return res.status(429).json({ error: "Too many review attempts. Please try again in 1 minute." });
    }
    if (body.rating < 1 || body.rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }
    if (body.comment.length > MAX_REVIEW_LENGTH) {
      return res.status(400).json({ error: `Comment too long (max ${MAX_REVIEW_LENGTH} chars)` });
    }

    const violationReason = detectReviewViolation(body.comment);
    const [review] = await db
      .insert(reviewsTable)
      .values({
        coachId: body.coachId,
        userId,
        userName: body.userName ?? null,
        rating: body.rating,
        comment: body.comment,
        isApproved: true,
        isRemoved: !!violationReason,
        removedReason: violationReason,
        removedAt: violationReason ? new Date() : null,
        removedBy: violationReason ? "system:auto-moderation" : null,
      })
      .returning();

    res.status(201).json(toReviewResponse(review));
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

    res.json(reviews.map(toReviewResponse));
  } catch (err) {
    req.log.error({ err }, "getCoachReviews error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id/reply", async (req, res) => {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const replyComment = typeof req.body?.replyComment === "string" ? req.body.replyComment.trim() : "";
    if (!replyComment) return res.status(400).json({ error: "replyComment is required" });
    if (replyComment.length > 800) return res.status(400).json({ error: "replyComment too long" });

    const [review] = await db.select().from(reviewsTable).where(eq(reviewsTable.id, id));
    if (!review) return res.status(404).json({ error: "Review not found" });

    const [coach] = await db
      .select({ userId: coachesTable.userId })
      .from(coachesTable)
      .where(eq(coachesTable.id, review.coachId));
    if (!coach) return res.status(404).json({ error: "Coach not found" });

    if (coach.userId !== userId) {
      return res.status(403).json({ error: "Only this coach can reply to this review" });
    }

    const [updated] = await db
      .update(reviewsTable)
      .set({
        replyComment,
        replyAt: new Date(),
        replyBy: userId,
      })
      .where(eq(reviewsTable.id, id))
      .returning();

    res.json(toReviewResponse(updated));
  } catch (err) {
    req.log.error({ err }, "replyReview error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
