import { Router } from "express";
import { db } from "@workspace/db";
import { userProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";

const router = Router();

router.get("/", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const [profile] = await db.select().from(userProfilesTable)
    .where(eq(userProfilesTable.userId, userId));

  if (!profile) return res.json({ profile: null });
  res.json({ profile });
});

router.put("/", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { displayName, goals, availability, preferredDistricts, preferredSports, onboardingCompleted } = req.body;

  const existing = await db.select().from(userProfilesTable)
    .where(eq(userProfilesTable.userId, userId));

  if (existing.length === 0) {
    const [profile] = await db.insert(userProfilesTable).values({
      userId,
      displayName: displayName || null,
      goals: goals || [],
      availability: availability || [],
      preferredDistricts: preferredDistricts || [],
      preferredSports: preferredSports || [],
      onboardingCompleted: onboardingCompleted ?? false,
    }).returning();
    return res.json({ profile });
  } else {
    const [profile] = await db.update(userProfilesTable)
      .set({
        displayName: displayName !== undefined ? displayName : existing[0].displayName,
        goals: goals !== undefined ? goals : existing[0].goals,
        availability: availability !== undefined ? availability : existing[0].availability,
        preferredDistricts: preferredDistricts !== undefined ? preferredDistricts : existing[0].preferredDistricts,
        preferredSports: preferredSports !== undefined ? preferredSports : existing[0].preferredSports,
        onboardingCompleted: onboardingCompleted !== undefined ? onboardingCompleted : existing[0].onboardingCompleted,
      })
      .where(eq(userProfilesTable.userId, userId))
      .returning();
    return res.json({ profile });
  }
});

export default router;
