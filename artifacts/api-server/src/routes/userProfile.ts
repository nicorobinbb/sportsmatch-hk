import { Router } from "express";
import { db } from "@workspace/db";
import { userProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getAuth, clerkClient } from "@clerk/express";

const router = Router();

async function fetchClerkUserMeta(userId: string) {
  try {
    const u = await clerkClient.users.getUser(userId);
    const email = u.primaryEmailAddress?.emailAddress
      ?? u.emailAddresses?.[0]?.emailAddress
      ?? null;
    return {
      email,
      imageUrl: u.imageUrl ?? null,
      firstName: u.firstName ?? null,
      lastName: u.lastName ?? null,
    };
  } catch {
    return { email: null, imageUrl: null, firstName: null, lastName: null };
  }
}

router.get("/", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  let [profile] = await db.select().from(userProfilesTable)
    .where(eq(userProfilesTable.userId, userId));

  if (!profile) {
    const meta = await fetchClerkUserMeta(userId);
    [profile] = await db.insert(userProfilesTable).values({
      userId,
      email: meta.email,
      imageUrl: meta.imageUrl,
      firstName: meta.firstName,
      lastName: meta.lastName,
      displayName: [meta.firstName, meta.lastName].filter(Boolean).join(" ").trim() || null,
      onboardingCompleted: false,
    }).returning();
    req.log?.info({ userId, email: meta.email }, "Auto-created stub user profile on first sign-in");
  } else if (!profile.email || !profile.imageUrl) {
    const meta = await fetchClerkUserMeta(userId);
    if (meta.email || meta.imageUrl) {
      [profile] = await db.update(userProfilesTable)
        .set({
          email: profile.email ?? meta.email,
          imageUrl: profile.imageUrl ?? meta.imageUrl,
        })
        .where(eq(userProfilesTable.userId, userId))
        .returning();
    }
  }

  res.json({ profile });
});

router.put("/", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const {
    firstName, lastName, displayName,
    goals, availability,
    preferredDistricts, preferredSports, preferredAgeGroups,
    onboardingCompleted,
  } = req.body;

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
      preferredAgeGroups: preferredAgeGroups ?? [],
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
        preferredAgeGroups: preferredAgeGroups !== undefined ? preferredAgeGroups : (existing[0] as any).preferredAgeGroups ?? [],
        onboardingCompleted: onboardingCompleted !== undefined ? onboardingCompleted : existing[0].onboardingCompleted,
      })
      .where(eq(userProfilesTable.userId, userId))
      .returning();
    return res.json({ profile });
  }
});

export default router;
