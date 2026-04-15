import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../db/schema";
import { ENV } from "./env";

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function initDb() {
  if (!ENV.NEON_DATABASE_URL) {
    throw new Error("❌ NEON_DATABASE_URL is not defined. Did you load .env?");
  }

  const sql = neon(ENV.NEON_DATABASE_URL);
  db = drizzle(sql, { schema });
  console.log("✅ DB initialized");
}

export function getDb() {
  if (!db) throw new Error("❌ DB not initialized yet! Call initDb() first.");
  return db;
}
