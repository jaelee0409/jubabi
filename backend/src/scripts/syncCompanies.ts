import AdmZip from "adm-zip";
import { sql } from "drizzle-orm";
import xml2js from "xml2js";
import { companies } from "../db/schema";
import { fetchCompanyCode } from "./dart";
import { companiesCache } from "../cache/companiesCache";
import { getDb } from "../config/db";

interface CorpItem {
  corp_code: string;
  corp_name: string;
  stock_code: string;
  modify_date: string;
}

export const syncCompanies = async () => {
  try {
    const response = await fetchCompanyCode();

    // Extract ZIP
    const buffer = await response.arrayBuffer();

    const zip = new AdmZip(Buffer.from(buffer));
    const entry = zip.getEntries().find((e) => e.entryName === "CORPCODE.xml");

    if (!entry) {
      throw new Error("❌ CORPCODE.xml not found in zip");
    }

    const xmlData = entry.getData().toString("utf-8");

    // 3. XML 파싱
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(xmlData);

    // 4. 구조 확인
    if (!result?.result?.list) {
      throw new Error("❌ Invalid XML structure: result.list 없음");
    }

    const items: CorpItem[] = result.result.list;

    // 4. DB에 맞는 형식으로 변환 및 필터링
    const validCompanies = items.map((item) => ({
      corpCode: item.corp_code.trim(),
      name: item.corp_name.trim(),
      stockCode: item.stock_code.trim() || null,
    }));

    console.log(`📊 Valid records: ${items.length}`);

    const CHUNK_SIZE = 1000;
    for (let i = 0; i < validCompanies.length; i += CHUNK_SIZE) {
      const chunk = validCompanies.slice(i, i + CHUNK_SIZE);

      const db = getDb();
      await db
        .insert(companies)
        .values(chunk)
        .onConflictDoUpdate({
          target: companies.corpCode, // PK 또는 UNIQUE key
          set: {
            stockCode: sql`excluded.stock_code`,
            name: sql`excluded.name`,
          },
          setWhere: sql`( ${companies.stockCode} IS DISTINCT FROM excluded.stock_code OR ${companies.name} IS DISTINCT FROM excluded.name )`,
        });

      console.log(`Processed ${i + chunk.length} records`);
    }

    // Update companies cache
    await companiesCache.load();

    console.log("✅ Finished syncCompanies");
  } catch (error) {
    console.error("❌ Error syncing companies:", error);
    process.exit(1);
  }
};
