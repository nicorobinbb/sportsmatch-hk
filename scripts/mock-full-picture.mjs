#!/usr/bin/env node
/**
 * Seed rich mock data so coach/profile pages look complete.
 *
 * Usage:
 *   node scripts/mock-full-picture.mjs
 *   node scripts/mock-full-picture.mjs --coachId=54
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, "utf8");
  const out = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
    out[key] = value;
  }
  return out;
}

const envPath = path.join(__dirname, "../artifacts/api-server/.env");
const env = loadEnvFile(envPath);
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
  process.exit(1);
}
const coachIdArg = process.argv.find((arg) => arg.startsWith("--coachId="));
const targetCoachId = coachIdArg ? Number(coachIdArg.split("=")[1]) : null;

const restBase = `${SUPABASE_URL}/rest/v1`;

async function request(table, { method = "GET", query = {}, body, prefer } = {}) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    params.set(k, String(v));
  }
  const url = `${restBase}/${table}${params.toString() ? `?${params.toString()}` : ""}`;
  const headers = {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (prefer) headers.Prefer = prefer;

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${table} failed (${res.status}): ${text}`);
  }
  if (res.status === 204) return [];
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

const REVIEW_NAMES = [
  "阿明",
  "Jessica",
  "Chris",
  "Wing",
  "Sam",
  "Kay",
  "Iris",
  "Jason",
];

const REVIEW_BODIES = [
  "教練好細心，會按我程度調整動作，兩個星期已經見到進步。",
  "上堂氣氛好好，解釋清楚，訓練後有跟進建議。",
  "時間安排彈性，地點方便，整體體驗好。",
  "專業又有耐性，初學者都容易跟到。",
  "每堂都有明確目標，感覺到自己慢慢提升。",
  "對姿勢糾正很到位，避免受傷，值得推薦。",
];

const REPLY_BODIES = [
  "多謝你嘅評價，我會繼續幫你穩定進步！",
  "感謝支持，下堂我哋會再加少少強度。",
  "多謝反饋，會繼續因材施教。",
];

function buildPricingPlans() {
  return JSON.stringify([
    { sessionType: "單對單", price: "380", duration: "60分鐘", maxStudents: "1", ageGroup: "成人（18歲以上）" },
    { sessionType: "單對單", price: "520", duration: "90分鐘", maxStudents: "1", ageGroup: "成人（18歲以上）" },
    { sessionType: "小組", price: "220", duration: "90分鐘", minStudents: "3", maxStudents: "6", ageGroup: "青少年（12-17歲）" },
  ]);
}

function buildQualifications(sport) {
  return JSON.stringify([
    { text: `${sport} 註冊教練證書（Level 2）`, proofUrl: "https://picsum.photos/seed/mockseed-qual-1/900/1200", status: "approved" },
    { text: "運動急救證書", proofUrl: "https://picsum.photos/seed/mockseed-qual-2/900/1200", status: "approved" },
    { text: "兒童訓練課程證書", proofUrl: "https://picsum.photos/seed/mockseed-qual-3/900/1200", status: "pending" },
    { text: "運動表現分析課程", proofUrl: "https://picsum.photos/seed/mockseed-qual-4/900/1200", status: "denied" },
  ]);
}

function buildPostMocks(coachId, sport) {
  return [
    {
      coach_id: coachId,
      caption: `[MOCK] 本週訓練精華！${sport} 基礎動作＋節奏練習，完整片段：https://www.youtube.com/watch?v=dQw4w9WgXcQ`,
      media_urls: JSON.stringify([
        `https://picsum.photos/seed/mockseed-post-${coachId}-1/1200/900`,
        `https://picsum.photos/seed/mockseed-post-${coachId}-2/1200/900`,
      ]),
      youtube_url: null,
      is_approved: true,
      is_rejected: false,
    },
    {
      coach_id: coachId,
      caption: `[MOCK] 今堂班組表現好好！Instagram相集：https://www.instagram.com/p/C5s-example`,
      media_urls: JSON.stringify([`https://picsum.photos/seed/mockseed-post-${coachId}-3/1200/900`]),
      youtube_url: null,
      is_approved: true,
      is_rejected: false,
    },
    {
      coach_id: coachId,
      caption: `[MOCK] 下星期課堂時間已更新，Facebook活動：https://www.facebook.com/events/123456789`,
      media_urls: null,
      youtube_url: null,
      is_approved: true,
      is_rejected: false,
    },
  ];
}

async function getTargetCoaches() {
  if (targetCoachId) {
    return request("coaches", {
      query: { select: "*", id: `eq.${targetCoachId}`, limit: 1 },
    });
  }
  return request("coaches", {
    query: {
      select: "*",
      is_approved: "eq.true",
      order: "created_at.desc",
      limit: 8,
    },
  });
}

async function resetOldMockRows(coachId) {
  await request("coach_posts", { method: "DELETE", query: { coach_id: `eq.${coachId}`, caption: "like.[MOCK]%" } });
  await request("reviews", { method: "DELETE", query: { coach_id: `eq.${coachId}`, user_id: "like.mock-reviewer-%" } });
  await request("photos", { method: "DELETE", query: { coach_id: `eq.${coachId}`, image_url: "like.%mockseed%" } });
  await request("wishlists", { method: "DELETE", query: { coach_id: `eq.${coachId}`, user_id: "like.mock-fan-%" } });
}

async function seedCoachOverview(coach) {
  const next = {
    bio:
      coach.bio && coach.bio.length > 80
        ? coach.bio
        : `${coach.name} 擁有多年教學經驗，重視基本功、實戰應用同運動安全，會按學員程度制定清晰訓練計劃。`,
    package_details:
      coach.package_details ||
      "5堂套票：95折｜10堂套票：9折｜雙人同行每位每堂減$30",
    pricing_plans: coach.pricing_plans || buildPricingPlans(),
    qualifications: coach.qualifications || buildQualifications(coach.sports_category || "運動"),
    is_approved: true,
    is_rejected: false,
    is_featured: true,
  };

  await request("coaches", {
    method: "PATCH",
    query: { id: `eq.${coach.id}` },
    body: next,
  });
}

async function seedPhotos(coachId) {
  const photos = Array.from({ length: 4 }).map((_, idx) => ({
    coach_id: coachId,
    image_url: `https://picsum.photos/seed/mockseed-photo-${coachId}-${idx + 1}/1200/900`,
    is_approved: true,
  }));
  await request("photos", { method: "POST", body: photos, prefer: "return=representation" });
}

async function seedPosts(coachId, sport) {
  await request("coach_posts", {
    method: "POST",
    body: buildPostMocks(coachId, sport),
    prefer: "return=representation",
  });
}

async function seedReviewsWithReplies(coach) {
  const rows = REVIEW_NAMES.map((name, idx) => ({
    coach_id: coach.id,
    user_id: `mock-reviewer-${coach.id}-${idx + 1}`,
    user_name: name,
    rating: 4 + (idx % 2),
    comment: REVIEW_BODIES[idx % REVIEW_BODIES.length],
    is_approved: true,
  }));

  // One moderated review example
  rows.push({
    coach_id: coach.id,
    user_id: `mock-reviewer-${coach.id}-removed`,
    user_name: "匿名用戶",
    rating: 1,
    comment: "removed by admin due to unrelated advertising",
    is_approved: true,
  });

  const inserted = await request("reviews", { method: "POST", body: rows, prefer: "return=representation" });

  // Best-effort: set one-layer coach replies when columns exist.
  for (let i = 0; i < Math.min(4, inserted.length); i++) {
    const review = inserted[i];
    try {
      await request("reviews", {
        method: "PATCH",
        query: { id: `eq.${review.id}` },
        body: {
          reply_comment: REPLY_BODIES[i % REPLY_BODIES.length],
          reply_at: new Date().toISOString(),
          reply_by: coach.user_id,
        },
      });
    } catch {
      // Ignore if reply columns are not yet available in schema cache.
    }
  }
}

async function seedWishlists(coachId) {
  const rows = Array.from({ length: 12 }).map((_, idx) => ({
    user_id: `mock-fan-${idx + 1}`,
    coach_id: coachId,
  }));
  await request("wishlists", {
    method: "POST",
    query: { on_conflict: "user_id,coach_id" },
    body: rows,
    prefer: "resolution=merge-duplicates,return=representation",
  });
}

async function run() {
  const coaches = await getTargetCoaches();
  if (!coaches.length) {
    console.log("No coaches found. Please create coach records first.");
    return;
  }

  console.log(`Seeding full mock picture for ${coaches.length} coach(es)...`);
  for (const coach of coaches) {
    await resetOldMockRows(coach.id);
    await seedCoachOverview(coach);
    await seedPhotos(coach.id);
    await seedPosts(coach.id, coach.sports_category || "運動");
    await seedReviewsWithReplies(coach);
    await seedWishlists(coach.id);
    console.log(`  ✓ Coach #${coach.id} ${coach.name}`);
  }

  console.log("\nDone. Coach pages should now show complete, rich demo data.");
  console.log("Tip: run again anytime; old mock rows are cleaned and re-seeded.");
}

run().catch((error) => {
  console.error("Mock seeding failed:", error.message || error);
  process.exit(1);
});

