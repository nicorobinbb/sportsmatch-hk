// Get Supabase users
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const postgres = require("../lib/db/node_modules/postgres");

const DATABASE_URL = "postgresql://postgres.vosbykmmrfcyrdrkvinx:Felixisagenius!@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres";
const sql = postgres(DATABASE_URL, { ssl: { rejectUnauthorized: false }, prepare: false });

async function main() {
  // auth.users table
  const users = await sql`SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 10`;
  console.log("Recent users:");
  users.forEach(u => {
    console.log(`- ${u.id} | ${u.email} | ${u.created_at}`);
  });
  await sql.end();
}

main().catch(console.error);
