// Update existing coaches with random social media links - simplified version
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const postgres = require("../lib/db/node_modules/postgres");

const DATABASE_URL = "postgresql://postgres.vosbykmmrfcyrdrkvinx:Felixisagenius!@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres";

const sql = postgres(DATABASE_URL, { ssl: { rejectUnauthorized: false }, prepare: false });

// Social media link templates
const fbTemplates = [
  (name) => `https://facebook.com/coach.${name}`,
  (name) => `https://facebook.com/${name}.fitness`,
  (name) => `https://facebook.com/${name}.sports`,
];

const igTemplates = [
  (name) => `https://instagram.com/coach_${name}`,
  (name) => `https://instagram.com/${name}_fit`,
  (name) => `https://instagram.com/${name}_hk`,
];

const webTemplates = [
  (name) => `https://${name}.com`,
  (name) => `https://${name}-sports.hk`,
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function toUsername(name) {
  return name.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/gi, "");
}

async function main() {
  console.log("Fetching coaches...");
  const coaches = await sql`SELECT id, name FROM coaches`;
  console.log(`Found ${coaches.length} coaches`);

  for (const coach of coaches) {
    const username = toUsername(coach.name);
    
    // Randomly decide which social media to include
    // Some coaches have IG only, some have FB+IG, some have all three, some have none
    const rand = Math.random();
    
    let facebookUrl = null;
    let instagramUrl = null;
    let websiteUrl = null;

    if (rand < 0.15) {
      // 15% - No social media (all null)
      console.log(`${coach.name}: No social media`);
    } else if (rand < 0.35) {
      // 20% - Instagram only
      instagramUrl = randomItem(igTemplates)(username);
      console.log(`${coach.name}: IG only`);
    } else if (rand < 0.55) {
      // 20% - Facebook only  
      facebookUrl = randomItem(fbTemplates)(username);
      console.log(`${coach.name}: FB only`);
    } else if (rand < 0.75) {
      // 20% - FB + IG
      facebookUrl = randomItem(fbTemplates)(username);
      instagramUrl = randomItem(igTemplates)(username);
      console.log(`${coach.name}: FB + IG`);
    } else if (rand < 0.90) {
      // 15% - IG + Website
      instagramUrl = randomItem(igTemplates)(username);
      websiteUrl = randomItem(webTemplates)(username);
      console.log(`${coach.name}: IG + Website`);
    } else {
      // 10% - All three
      facebookUrl = randomItem(fbTemplates)(username);
      instagramUrl = randomItem(igTemplates)(username);
      websiteUrl = randomItem(webTemplates)(username);
      console.log(`${coach.name}: All three!`);
    }

    await sql`
      UPDATE coaches 
      SET facebook_url = ${facebookUrl}, 
          instagram_url = ${instagramUrl}, 
          website_url = ${websiteUrl}
      WHERE id = ${coach.id}
    `;
  }

  console.log("\n✅ All coaches updated!");
  await sql.end();
}

main().catch(console.error);
