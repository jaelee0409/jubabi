import type { PgDatabase } from "drizzle-orm/pg-core";
import { disclosures } from "../db/schema";

// 공시를 저장하고, 이번 호출이 처음 저장했으면 true를 돌려준다.
// PK 충돌로 이미 있던 공시면 false. 판정을 메모리 캐시가 아니라 DB에 맡기므로
// 재시작 직후나 폴링이 겹쳐 같은 공시를 여러 번 보더라도 true는 한 번만 나온다.
export async function claimDisclosure(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: PgDatabase<any, any>,
  values: typeof disclosures.$inferInsert
): Promise<boolean> {
  const inserted = await db
    .insert(disclosures)
    .values(values)
    .onConflictDoNothing()
    .returning({ receiptNumber: disclosures.receiptNumber });

  return inserted.length > 0;
}
