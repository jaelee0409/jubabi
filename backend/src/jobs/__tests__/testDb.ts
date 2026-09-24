import { PGlite } from "@electric-sql/pglite";
import { generateDrizzleJson, generateMigration } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "../../db/schema";

// 프로세스 안에서 도는 빈 Postgres에 schema.ts의 테이블을 만든다.
// 마이그레이션 이력은 빈 DB에서 재현되지 않으므로(0000이 users·companies를
// 만들지 않음) 코드가 실제로 쓰는 schema.ts를 기준으로 한다.
export async function createTestDb() {
  const client = new PGlite();
  const db = drizzle(client, { schema });

  const statements = await generateMigration(
    generateDrizzleJson({}),
    generateDrizzleJson(schema)
  );
  for (const statement of statements) await client.exec(statement);

  return { client, db };
}
