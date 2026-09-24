import { and, eq, exists, or, sql } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import { userAlerts, users, userStockFavorites } from "../db/schema";

// 공시 한 건에 대해 푸시를 받을 사용자 id 목록 (사용자당 한 번)
export async function findRecipients(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: PgDatabase<any, any>,
  corpCode: string,
  disclosureTitle: string
): Promise<string[]> {
  // JOIN은 매칭 행 수만큼 사용자를 곱하므로, "해당하는 행이 있는가"만 EXISTS로 판정한다
  const hasFavorite = exists(
    db
      .select({ one: sql`1` })
      .from(userStockFavorites)
      .where(
        and(
          eq(userStockFavorites.userId, users.id),
          eq(userStockFavorites.companyCorpCode, corpCode)
        )
      )
  );

  // 제목이 키워드를 포함하는지 본다. LIKE는 키워드의 %, _ 를 와일드카드로 해석하므로 strpos 사용
  const hasMatchingKeyword = exists(
    db
      .select({ one: sql`1` })
      .from(userAlerts)
      .where(
        and(
          eq(userAlerts.userId, users.id),
          eq(userAlerts.enabled, true),
          sql`${userAlerts.keyword} <> ''`,
          sql`strpos(${disclosureTitle}, ${userAlerts.keyword}) > 0`
        )
      )
  );

  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(or(hasFavorite, hasMatchingKeyword));

  return rows.map((row) => row.id);
}
