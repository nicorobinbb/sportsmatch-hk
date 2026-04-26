import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Supabase connection using postgres-js (better for serverless)
const client = postgres(process.env.DATABASE_URL, { 
  prepare: false, // Required for Supabase connection pooling
  max: 10,        // Connection pool size
  ssl: 'require', // Required for Supabase
});

export const db = drizzle(client, { schema });

export * from "./schema";
