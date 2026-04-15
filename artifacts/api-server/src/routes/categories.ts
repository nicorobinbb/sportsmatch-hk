import { Router } from "express";
import { db } from "@workspace/db";
import { coachesTable } from "@workspace/db";
import { and, eq, ne, sql } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const categories = await db
      .select({
        name: coachesTable.sportsCategory,
        coachCount: sql<number>`count(*)::int`,
      })
      .from(coachesTable)
      .where(and(eq(coachesTable.isApproved, true), ne(coachesTable.sportsCategory, "個人訓練")))
      .groupBy(coachesTable.sportsCategory)
      .orderBy(sql`count(*) desc`);

    res.json(categories);
  } catch (err) {
    req.log.error({ err }, "listCategories error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
