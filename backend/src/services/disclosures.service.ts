import { getDb } from "../config/db";
import { disclosures } from "../db/schema";
import { desc, eq } from "drizzle-orm";

export async function getRecentDisclosures(limit = 20, offset = 0, category?: string) {
  const db = getDb();
  const base = db.select().from(disclosures).orderBy(desc(disclosures.disclosedAt));
  const filtered =
    category && category !== "ALL"
      ? base.where(eq(disclosures.category, category))
      : base;
  return filtered.limit(limit).offset(offset);
}
