import { and, eq, like, or } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import { userAlerts, users, userStockFavorites } from "../db/schema";

// 공시 한 건에 대해 푸시를 받을 사용자 id 목록
export async function findRecipients(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: PgDatabase<any, any>,
  corpCode: string,
  disclosureTitle: string
): Promise<string[]> {
  const rows = await db
    .select()
    .from(users)
    .leftJoin(
      userStockFavorites,
      eq(userStockFavorites.companyCorpCode, corpCode)
    )
    .leftJoin(
      userAlerts,
      and(
        like(userAlerts.keyword, `%${disclosureTitle}%`),
        eq(userAlerts.enabled, true)
      )
    )
    .where(
      or(
        eq(userStockFavorites.companyCorpCode, corpCode),
        and(
          like(userAlerts.keyword, `%${disclosureTitle}%`),
          eq(userAlerts.enabled, true)
        )
      )
    );

  return rows.filter((row) => row.users).map((row) => row.users.id);
}
