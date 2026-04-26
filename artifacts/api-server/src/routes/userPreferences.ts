import { Router } from "express";
import { db } from "@workspace/db";
import { userCategoryClicksTable } from "@workspace/db";
import { getAuth } from "../middlewares/supabaseAuthMiddleware.js";
import { eq, and, desc } from "drizzle-orm";
import { TrackCategoryClickBody } from "@workspace/api-zod";

const router = Router();

router.get("/preferences", async (req, res) => {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;
    if (!userId) {
      return res.json({ preferredCategories: [], clickHistory: {} });
    }

    const clicks = await db
      .select()
      .from(userCategoryClicksTable)
      .where(eq(userCategoryClicksTable.userId, userId))
      .orderBy(desc(userCategoryClicksTable.clickCount));

    const clickHistory: Record<string, number> = {};
    const preferredCategories: string[] = [];

    for (const click of clicks) {
      clickHistory[click.category] = click.clickCount;
      if (click.clickCount >= 1) {
        preferredCategories.push(click.category);
      }
    }

    res.json({ preferredCategories, clickHistory });
  } catch (err) {
    req.log.error({ err }, "getUserPreferences error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/preferences", async (req, res) => {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;
    if (!userId) {
      return res.json({ preferredCategories: [], clickHistory: {} });
    }

    const body = TrackCategoryClickBody.parse(req.body);
    const { category } = body;

    const existing = await db
      .select()
      .from(userCategoryClicksTable)
      .where(and(eq(userCategoryClicksTable.userId, userId), eq(userCategoryClicksTable.category, category)));

    if (existing.length > 0) {
      await db
        .update(userCategoryClicksTable)
        .set({ clickCount: existing[0].clickCount + 1 })
        .where(and(eq(userCategoryClicksTable.userId, userId), eq(userCategoryClicksTable.category, category)));
    } else {
      await db.insert(userCategoryClicksTable).values({ userId, category, clickCount: 1 });
    }

    const clicks = await db
      .select()
      .from(userCategoryClicksTable)
      .where(eq(userCategoryClicksTable.userId, userId))
      .orderBy(desc(userCategoryClicksTable.clickCount));

    const clickHistory: Record<string, number> = {};
    const preferredCategories: string[] = [];
    for (const click of clicks) {
      clickHistory[click.category] = click.clickCount;
      preferredCategories.push(click.category);
    }

    res.json({ preferredCategories, clickHistory });
  } catch (err) {
    req.log.error({ err }, "trackCategoryClick error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
