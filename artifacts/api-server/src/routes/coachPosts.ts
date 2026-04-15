import { Router } from "express";
import { db } from "@workspace/db";
import { coachPostsTable, coachesTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

function getAdminUserIds(): string[] {
  const raw = process.env.ADMIN_USER_IDS ?? "";
  return raw.split(",").map((id) => id.trim()).filter(Boolean);
}

// GET /api/posts/coach/:id — public, approved posts only
router.get("/coach/:id", async (req, res) => {
  try {
    const coachId = parseInt(req.params.id);
    if (isNaN(coachId)) return res.status(400).json({ error: "Invalid ID" });

    const posts = await db
      .select()
      .from(coachPostsTable)
      .where(and(eq(coachPostsTable.coachId, coachId), eq(coachPostsTable.isApproved, true)))
      .orderBy(desc(coachPostsTable.createdAt));

    res.json(posts.map(p => ({ ...p, createdAt: p.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "getCoachPosts error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/posts/coach/:id/my — coach sees own posts (all statuses)
router.get("/coach/:id/my", async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) return res.status(401).json({ error: "Unauthorized" });

    const coachId = parseInt(req.params.id);
    if (isNaN(coachId)) return res.status(400).json({ error: "Invalid ID" });

    // Verify coach ownership
    const [coach] = await db.select({ userId: coachesTable.userId }).from(coachesTable).where(eq(coachesTable.id, coachId));
    const adminIds = getAdminUserIds();
    if (!coach || (coach.userId !== auth.userId && !adminIds.includes(auth.userId))) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const posts = await db
      .select()
      .from(coachPostsTable)
      .where(eq(coachPostsTable.coachId, coachId))
      .orderBy(desc(coachPostsTable.createdAt));

    res.json(posts.map(p => ({ ...p, createdAt: p.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "getMyCoachPosts error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/posts/coach/:id — coach creates a post
router.post("/coach/:id", async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) return res.status(401).json({ error: "Unauthorized" });

    const coachId = parseInt(req.params.id);
    if (isNaN(coachId)) return res.status(400).json({ error: "Invalid ID" });

    // Verify coach ownership
    const [coach] = await db.select({ userId: coachesTable.userId }).from(coachesTable).where(eq(coachesTable.id, coachId));
    if (!coach || coach.userId !== auth.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { caption, mediaUrls, youtubeUrl } = req.body;
    if (!caption && (!mediaUrls || mediaUrls.length === 0) && !youtubeUrl) {
      return res.status(400).json({ error: "Post must have caption, media, or video" });
    }

    const [post] = await db
      .insert(coachPostsTable)
      .values({
        coachId,
        caption: caption || null,
        mediaUrls: mediaUrls && mediaUrls.length > 0 ? JSON.stringify(mediaUrls) : null,
        youtubeUrl: youtubeUrl || null,
      })
      .returning();

    res.status(201).json({ ...post, createdAt: post.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "createCoachPost error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/posts/:postId — coach or admin deletes a post
router.delete("/:postId", async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) return res.status(401).json({ error: "Unauthorized" });

    const postId = parseInt(req.params.postId);
    if (isNaN(postId)) return res.status(400).json({ error: "Invalid ID" });

    const [post] = await db.select().from(coachPostsTable).where(eq(coachPostsTable.id, postId));
    if (!post) return res.status(404).json({ error: "Not found" });

    const [coach] = await db.select({ userId: coachesTable.userId }).from(coachesTable).where(eq(coachesTable.id, post.coachId));
    const adminIds = getAdminUserIds();
    if (!coach || (coach.userId !== auth.userId && !adminIds.includes(auth.userId))) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await db.delete(coachPostsTable).where(eq(coachPostsTable.id, postId));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "deleteCoachPost error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
