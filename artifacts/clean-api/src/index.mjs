import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

const port = Number(process.env.PORT || 3001);
const configuredOrigins = (process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);
const frontendOrigins = Array.from(
  new Set(["http://localhost:5175", "http://localhost:5176", ...configuredOrigins]),
);
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.DATABASE_URL;

if (!supabaseUrl || !serviceRoleKey || !databaseUrl) {
  throw new Error("Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or DATABASE_URL");
}

const supabase = createClient(supabaseUrl, serviceRoleKey);
const sql = postgres(databaseUrl, { ssl: "require", prepare: false });
const app = express();

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser clients (curl/postman) with no origin header.
      if (!origin) return callback(null, true);
      if (frontendOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(express.json());

function getAdminIds() {
  return (process.env.ADMIN_USER_IDS || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

async function authMiddleware(req, _res, next) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  const token = authHeader.slice("Bearer ".length);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    req.user = null;
    return next();
  }

  req.user = {
    id: data.user.id,
    email: data.user.email ?? null,
  };
  next();
}

app.use(authMiddleware);

app.get("/healthz", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/admin/status", (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const isAdmin = getAdminIds().includes(req.user.id);
  res.json({
    isAdmin,
    userId: req.user.id,
    email: req.user.email,
  });
});

app.get("/api/coaches", async (req, res) => {
  try {
    const parsedLimit = Number(req.query.limit || 50);
    const limit = Number.isFinite(parsedLimit) ? Math.max(1, Math.min(100, parsedLimit)) : 50;

    const rows = await sql`
      select
        c.id,
        c.user_id as "userId",
        c.name,
        c.sports_category as "sportsCategory",
        c.location,
        c.bio,
        c.trial_price as "trialPrice",
        c.regular_price as "regularPrice",
        c.package_details as "packageDetails",
        c.age_groups as "ageGroups",
        c.teaching_focus as "teachingFocus",
        c.experience_level as "experienceLevel",
        c.is_featured as "isFeatured",
        c.is_approved as "isApproved",
        c.profile_image_url as "profileImageUrl",
        c.cover_photo_url as "coverPhotoUrl",
        c.pricing_plans as "pricingPlans",
        c.created_at as "createdAt",
        avg(r.rating)::float as "averageRating",
        count(distinct r.id)::int as "reviewCount"
      from coaches c
      left join reviews r on r.coach_id = c.id and r.is_approved = true
      where c.is_approved = true
      group by c.id
      order by c.is_featured desc, c.created_at desc
      limit ${limit}
    `;

    const totalRows = await sql`select count(*)::int as count from coaches where is_approved = true`;
    res.json({ coaches: rows, total: totalRows[0]?.count ?? 0 });
  } catch (error) {
    console.error("[clean-api] list coaches failed", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

function requireAdmin(req, res, next) {
  if (!req.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!getAdminIds().includes(req.user.id)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

app.get("/api/admin/coaches/pending", requireAdmin, async (_req, res) => {
  try {
    const rows = await sql`
      select
        id,
        user_id as "userId",
        name,
        sports_category as "sportsCategory",
        location,
        bio,
        trial_price as "trialPrice",
        regular_price as "regularPrice",
        package_details as "packageDetails",
        age_groups as "ageGroups",
        teaching_focus as "teachingFocus",
        experience_level as "experienceLevel",
        is_featured as "isFeatured",
        is_approved as "isApproved",
        is_rejected as "isRejected",
        profile_image_url as "profileImageUrl",
        cover_photo_url as "coverPhotoUrl",
        pricing_plans as "pricingPlans",
        created_at as "createdAt"
      from coaches
      where is_approved = false and is_rejected = false
      order by created_at desc
    `;

    res.json({ coaches: rows });
  } catch (error) {
    console.error("[clean-api] pending coaches failed", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/coaches/:id/approve", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  try {
    const rows = await sql`
      update coaches
      set is_approved = true, is_rejected = false
      where id = ${id}
      returning id, name, is_approved as "isApproved", is_rejected as "isRejected"
    `;
    if (!rows[0]) {
      return res.status(404).json({ error: "Coach not found" });
    }
    res.json({ coach: rows[0] });
  } catch (error) {
    console.error("[clean-api] approve coach failed", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/coaches/:id/reject", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  try {
    const rows = await sql`
      update coaches
      set is_approved = false, is_rejected = true
      where id = ${id}
      returning id, name, is_approved as "isApproved", is_rejected as "isRejected"
    `;
    if (!rows[0]) {
      return res.status(404).json({ error: "Coach not found" });
    }
    res.json({ coach: rows[0] });
  } catch (error) {
    console.error("[clean-api] reject coach failed", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/coaches/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });
  try {
    const rows = await sql`
      select
        id,
        user_id as "userId",
        name,
        sports_category as "sportsCategory",
        location,
        bio,
        trial_price as "trialPrice",
        regular_price as "regularPrice",
        package_details as "packageDetails",
        age_groups as "ageGroups",
        teaching_focus as "teachingFocus",
        experience_level as "experienceLevel",
        is_featured as "isFeatured",
        is_approved as "isApproved",
        is_rejected as "isRejected",
        profile_image_url as "profileImageUrl",
        cover_photo_url as "coverPhotoUrl",
        whatsapp_number as "whatsappNumber",
        youtube_url as "youtubeUrl",
        facebook_url as "facebookUrl",
        instagram_url as "instagramUrl",
        website_url as "websiteUrl",
        pricing_plans as "pricingPlans",
        qualifications,
        created_at as "createdAt",
        updated_at as "updatedAt"
      from coaches
      where id = ${id}
      limit 1
    `;
    if (!rows[0]) return res.status(404).json({ error: "Coach not found" });
    res.json({ coach: rows[0] });
  } catch (error) {
    console.error("[clean-api] get coach failed", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/api/admin/coaches/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });

  const {
    name,
    sportsCategory,
    location,
    bio,
    trialPrice,
    regularPrice,
    packageDetails,
    experienceLevel,
    whatsappNumber,
    profileImageUrl,
    coverPhotoUrl,
    youtubeUrl,
    facebookUrl,
    instagramUrl,
    websiteUrl,
  } = req.body || {};

  try {
    const rows = await sql`
      update coaches
      set
        name = coalesce(${name}, name),
        sports_category = coalesce(${sportsCategory}, sports_category),
        location = coalesce(${location}, location),
        bio = coalesce(${bio}, bio),
        trial_price = coalesce(${trialPrice}, trial_price),
        regular_price = coalesce(${regularPrice}, regular_price),
        package_details = coalesce(${packageDetails}, package_details),
        experience_level = coalesce(${experienceLevel}, experience_level),
        whatsapp_number = coalesce(${whatsappNumber}, whatsapp_number),
        profile_image_url = coalesce(${profileImageUrl}, profile_image_url),
        cover_photo_url = coalesce(${coverPhotoUrl}, cover_photo_url),
        youtube_url = coalesce(${youtubeUrl}, youtube_url),
        facebook_url = coalesce(${facebookUrl}, facebook_url),
        instagram_url = coalesce(${instagramUrl}, instagram_url),
        website_url = coalesce(${websiteUrl}, website_url),
        updated_at = now()
      where id = ${id}
      returning
        id,
        name,
        sports_category as "sportsCategory",
        location,
        bio,
        trial_price as "trialPrice",
        regular_price as "regularPrice",
        package_details as "packageDetails",
        experience_level as "experienceLevel",
        whatsapp_number as "whatsappNumber",
        profile_image_url as "profileImageUrl",
        cover_photo_url as "coverPhotoUrl",
        youtube_url as "youtubeUrl",
        facebook_url as "facebookUrl",
        instagram_url as "instagramUrl",
        website_url as "websiteUrl",
        updated_at as "updatedAt"
    `;
    if (!rows[0]) return res.status(404).json({ error: "Coach not found" });
    res.json({ coach: rows[0] });
  } catch (error) {
    console.error("[clean-api] update coach failed", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/reviews/pending", requireAdmin, async (_req, res) => {
  try {
    const rows = await sql`
      select
        r.id,
        r.coach_id as "coachId",
        c.name as "coachName",
        r.user_id as "userId",
        r.user_name as "userName",
        r.rating,
        r.comment,
        r.is_approved as "isApproved",
        r.created_at as "createdAt"
      from reviews r
      left join coaches c on c.id = r.coach_id
      where r.is_approved = false
      order by r.created_at desc
    `;
    res.json({ reviews: rows });
  } catch (error) {
    console.error("[clean-api] pending reviews failed", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/reviews/:id/approve", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });
  try {
    const rows = await sql`
      update reviews
      set is_approved = true
      where id = ${id}
      returning id, coach_id as "coachId", is_approved as "isApproved"
    `;
    if (!rows[0]) return res.status(404).json({ error: "Review not found" });
    res.json({ review: rows[0] });
  } catch (error) {
    console.error("[clean-api] approve review failed", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/reviews/:id/reject", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });
  try {
    const rows = await sql`
      delete from reviews
      where id = ${id}
      returning id
    `;
    if (!rows[0]) return res.status(404).json({ error: "Review not found" });
    res.json({ ok: true, id });
  } catch (error) {
    console.error("[clean-api] reject review failed", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/photos/pending", requireAdmin, async (_req, res) => {
  try {
    const rows = await sql`
      select
        p.id,
        p.coach_id as "coachId",
        c.name as "coachName",
        p.image_url as "imageUrl",
        p.is_approved as "isApproved",
        p.created_at as "createdAt"
      from photos p
      left join coaches c on c.id = p.coach_id
      where p.is_approved = false
      order by p.created_at desc
    `;
    res.json({ photos: rows });
  } catch (error) {
    console.error("[clean-api] pending photos failed", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/photos/:id/approve", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });
  try {
    const rows = await sql`
      update photos
      set is_approved = true
      where id = ${id}
      returning id, coach_id as "coachId", is_approved as "isApproved"
    `;
    if (!rows[0]) return res.status(404).json({ error: "Photo not found" });
    res.json({ photo: rows[0] });
  } catch (error) {
    console.error("[clean-api] approve photo failed", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/photos/:id/reject", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });
  try {
    const rows = await sql`
      delete from photos
      where id = ${id}
      returning id
    `;
    if (!rows[0]) return res.status(404).json({ error: "Photo not found" });
    res.json({ ok: true, id });
  } catch (error) {
    console.error("[clean-api] reject photo failed", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/reports", requireAdmin, async (_req, res) => {
  try {
    const rows = await sql`
      select
        r.id,
        r.user_id as "userId",
        r.coach_id as "coachId",
        c.name as "coachName",
        r.reason,
        r.description,
        r.status,
        r.admin_note as "adminNote",
        r.created_at as "createdAt"
      from reports r
      left join coaches c on c.id = r.coach_id
      order by r.created_at desc
    `;
    res.json({ reports: rows });
  } catch (error) {
    console.error("[clean-api] list reports failed", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/metrics", requireAdmin, async (_req, res) => {
  try {
    const [totalCoaches] = await sql`select count(*)::int as count from coaches where is_approved = true`;
    const [pendingCoaches] = await sql`select count(*)::int as count from coaches where is_approved = false and is_rejected = false`;
    const [pendingReviews] = await sql`select count(*)::int as count from reviews where is_approved = false`;
    const [pendingPhotos] = await sql`select count(*)::int as count from photos where is_approved = false`;
    const [openReports] = await sql`select count(*)::int as count from reports where status = 'pending'`;

    res.json({
      totalCoaches: totalCoaches?.count ?? 0,
      pendingCoaches: pendingCoaches?.count ?? 0,
      pendingReviews: pendingReviews?.count ?? 0,
      pendingPhotos: pendingPhotos?.count ?? 0,
      openReports: openReports?.count ?? 0,
    });
  } catch (error) {
    console.error("[clean-api] metrics failed", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/api/admin/reports/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });
  const { status, adminNote } = req.body || {};
  if (typeof status !== "string" || !status) {
    return res.status(400).json({ error: "status is required" });
  }
  try {
    const rows = await sql`
      update reports
      set status = ${status}, admin_note = ${adminNote ?? null}, updated_at = now()
      where id = ${id}
      returning id, status, admin_note as "adminNote"
    `;
    if (!rows[0]) return res.status(404).json({ error: "Report not found" });
    res.json({ report: rows[0] });
  } catch (error) {
    console.error("[clean-api] update report failed", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`[clean-api] listening on http://localhost:${port}`);
});
