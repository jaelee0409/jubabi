import { companies } from "../db/schema";
import { getDb } from "../config/db";

type Company = {
  corpCode: string;
  name: string;
  stockCode?: string;
  market?: string;
};

class CompaniesCache {
  private map: Map<string, Company> = new Map();

  async load() {
    console.log("🔄 Loading companies cache...");
    const db = getDb();
    const rows = await db.select().from(companies);

    this.map.clear();
    for (const row of rows) {
      this.map.set(row.corpCode, {
        corpCode: row.corpCode,
        name: row.name,
        stockCode: row.stockCode ?? undefined,
        market: row.market ?? undefined,
      });
    }

    console.log(`✅ Companies cache loaded: ${this.map.size} entries`);
  }

  getByCorpCode(corpCode: string): Company | undefined {
    return this.map.get(corpCode);
  }

  getByName(name: string): Company | undefined {
    return [...this.map.values()].find((c) => c.name === name);
  }

  getAll() {
    return [...this.map.values()];
  }
}

export const companiesCache = new CompaniesCache();
