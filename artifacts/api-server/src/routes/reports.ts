import { Router } from "express";
import { db } from "@workspace/db";
import { reportsTable, coachesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { getAuth } from "../middlewares/supabaseAuthMiddleware.js";

const router = Router();

router.post("/", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { coachId, reason, description } = req.body;
  if (!coachId || !reason) return res.status(400).json({ error: "coachId and reason required" });

  const [report] = await db.insert(reportsTable).values({
    userId,
    coachId: parseInt(coachId, 10),
    reason,
    description: description || null,
  }).returning();

  res.status(201).json({ success: true, reportId: report.id });
});

router.get("/admin", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const adminIds = (process.env.ADMIN_USER_IDS ?? "").split(",").map(s => s.trim()).filter(Boolean);
  if (!adminIds.includes(userId)) return res.status(403).json({ error: "Forbidden" });

  const reports = await db
    .select({
      id: reportsTable.id,
      userId: reportsTable.userId,
      coachId: reportsTable.coachId,
      coachName: coachesTable.name,
      reason: reportsTable.reason,
      description: reportsTable.description,
      status: reportsTable.status,
      adminNote: reportsTable.adminNote,
      createdAt: reportsTable.createdAt,
    })
    .from(reportsTable)
    .leftJoin(coachesTable, eq(reportsTable.coachId, coachesTable.id))
    .orderBy(desc(reportsTable.createdAt));

  res.json({ reports });
});

router.patch("/admin/:id", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const adminIds = (process.env.ADMIN_USER_IDS ?? "").split(",").map(s => s.trim()).filter(Boolean);
  if (!adminIds.includes(userId)) return res.status(403).json({ error: "Forbidden" });

  const reportId = parseInt(req.params.id, 10);
  const { status, adminNote } = req.body;

  const [updated] = await db.update(reportsTable)
    .set({ status, adminNote })
    .where(eq(reportsTable.id, reportId))
    .returning();

  res.json({ report: updated });
});

export default router;
