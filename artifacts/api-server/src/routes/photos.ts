import { Router } from "express";
import { db } from "@workspace/db";
import { photosTable } from "@workspace/db";
import { getAuth } from "../middlewares/supabaseAuthMiddleware.js";
import { eq, and } from "drizzle-orm";

const router = Router();
const MAX_IMAGE_DATA_URL_LENGTH = 2_500_000; // roughly <= 1.8MB image payload after base64
const PHOTO_UPLOAD_LIMIT_WINDOW_MS = 60_000;
const PHOTO_UPLOAD_LIMIT_COUNT = 10;
const photoUploadCounter = new Map<string, { count: number; startedAt: number }>();

function isLikelyImageDataUrl(value: string): boolean {
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(value);
}

function checkUploadRateLimit(userId: string): boolean {
  const now = Date.now();
  const current = photoUploadCounter.get(userId);
  if (!current || now - current.startedAt > PHOTO_UPLOAD_LIMIT_WINDOW_MS) {
    photoUploadCounter.set(userId, { count: 1, startedAt: now });
    return true;
  }
  if (current.count >= PHOTO_UPLOAD_LIMIT_COUNT) return false;
  current.count += 1;
  photoUploadCounter.set(userId, current);
  return true;
}

router.get("/coach/:id", async (req, res) => {
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

router.post("/coach/:id", async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) return res.status(401).json({ error: "Unauthorized" });

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    if (!checkUploadRateLimit(auth.userId)) {
      return res.status(429).json({ error: "Too many uploads. Please try again in 1 minute." });
    }

    const body = req.body as { imageUrl?: string };
    if (!body?.imageUrl || typeof body.imageUrl !== "string") {
      return res.status(400).json({ error: "imageUrl is required" });
    }
    if (!isLikelyImageDataUrl(body.imageUrl)) {
      return res.status(400).json({ error: "Invalid image format. Please upload an image file." });
    }
    if (body.imageUrl.length > MAX_IMAGE_DATA_URL_LENGTH) {
      return res.status(413).json({ error: "Image too large. Please upload a smaller image." });
    }

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
