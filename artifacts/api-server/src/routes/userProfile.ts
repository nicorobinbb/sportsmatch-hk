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

  const { firstName, lastName, displayName, goals, availability, preferredDistricts, preferredSports, onboardingCompleted } = req.body;

  const existing = await db.select().from(userProfilesTable)
    .where(eq(userProfilesTable.userId, userId));

  const resolvedDisplayName = displayName !== undefined
    ? displayName
    : (firstName || lastName)
      ? `${firstName ?? ""} ${lastName ?? ""}`.trim()
      : (existing[0]?.displayName ?? null);

  if (existing.length === 0) {
    const [profile] = await db.insert(userProfilesTable).values({
      userId,
      firstName: firstName ?? null,
      lastName: lastName ?? null,
      displayName: resolvedDisplayName,
      goals: goals ?? [],
      availability: availability ?? [],
      preferredDistricts: preferredDistricts ?? [],
      preferredSports: preferredSports ?? [],
      onboardingCompleted: onboardingCompleted ?? false,
    }).returning();
    return res.json({ profile });
  } else {
    const [profile] = await db.update(userProfilesTable)
      .set({
        firstName: firstName !== undefined ? firstName : existing[0].firstName,
        lastName: lastName !== undefined ? lastName : existing[0].lastName,
        displayName: resolvedDisplayName,
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
