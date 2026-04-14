import { Router } from "express";
import { db } from "@workspace/db";
import { photosTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import { eq, and } from "drizzle-orm";
import { UploadCoachPhotoBody } from "@workspace/api-zod";

const router = Router();

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
