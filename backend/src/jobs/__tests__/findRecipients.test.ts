import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { generateDrizzleJson, generateMigration } from "drizzle-kit/api";
import * as schema from "../../db/schema";
import { findRecipients } from "../findRecipients";

const client = new PGlite();
const db = drizzle(client, { schema });

const SAMSUNG = "00126380";
const OTHER = "00164779";

let favUser: string; // 삼성전자를 관심종목에 등록
let keywordUser: string; // "유상증자" 키워드 알림 등록
let otherFavUser: string; // 다른 회사만 관심종목에 등록
let bystander: string; // 아무것도 등록 안 함

before(async () => {
  // 마이그레이션 이력은 빈 DB에서 재현되지 않으므로(0000이 users·companies를
  // 만들지 않음) 코드가 실제로 쓰는 schema.ts로부터 테이블을 만든다.
  const statements = await generateMigration(
    generateDrizzleJson({}),
    generateDrizzleJson(schema)
  );
  for (const statement of statements) await client.exec(statement);

  await db.insert(schema.companies).values([
    { corpCode: SAMSUNG, name: "삼성전자", stockCode: "005930" },
    { corpCode: OTHER, name: "SK하이닉스", stockCode: "000660" },
  ]);

  const inserted = await db
    .insert(schema.users)
    .values([
      { kakaoId: "fav" },
      { kakaoId: "keyword" },
      { kakaoId: "otherFav" },
      { kakaoId: "bystander" },
    ])
    .returning({ id: schema.users.id, kakaoId: schema.users.kakaoId });
  const idOf = (k: string) => inserted.find((u) => u.kakaoId === k)!.id;
  favUser = idOf("fav");
  keywordUser = idOf("keyword");
  otherFavUser = idOf("otherFav");
  bystander = idOf("bystander");

  await db.insert(schema.userStockFavorites).values([
    { userId: favUser, companyCorpCode: SAMSUNG },
    { userId: otherFavUser, companyCorpCode: OTHER },
  ]);
  await db
    .insert(schema.userAlerts)
    .values({ userId: keywordUser, keyword: "유상증자", enabled: true });
});

after(async () => {
  await client.close();
});

const sorted = (ids: string[]) => [...ids].sort();

test("관심종목 등록자에게만, 한 번씩 발송한다", async () => {
  const ids = await findRecipients(db, SAMSUNG, "단일판매ㆍ공급계약체결");
  assert.deepEqual(sorted(ids), sorted([favUser]));
});

test("공시 제목에 키워드가 포함되면 키워드 등록자에게 발송한다", async () => {
  const ids = await findRecipients(db, OTHER, "유상증자결정");
  assert.deepEqual(sorted(ids), sorted([otherFavUser, keywordUser]));
});

test("관심종목 등록자가 여럿이어도 각자 한 번씩만 받는다", async () => {
  const second = await db
    .insert(schema.users)
    .values({ kakaoId: "fav2" })
    .returning({ id: schema.users.id });
  await db
    .insert(schema.userStockFavorites)
    .values({ userId: second[0].id, companyCorpCode: SAMSUNG });

  const ids = await findRecipients(db, SAMSUNG, "주주총회소집결의");
  assert.deepEqual(sorted(ids), sorted([favUser, second[0].id]));
  assert.ok(!ids.includes(bystander));
});

test("비활성화된 키워드 알림은 무시한다", async () => {
  await db
    .update(schema.userAlerts)
    .set({ enabled: false })
    .where(eq(schema.userAlerts.userId, keywordUser));

  const ids = await findRecipients(db, OTHER, "유상증자결정");
  assert.deepEqual(sorted(ids), sorted([otherFavUser]));

  await db
    .update(schema.userAlerts)
    .set({ enabled: true })
    .where(eq(schema.userAlerts.userId, keywordUser));
});

test("키워드의 %, _ 는 와일드카드가 아니라 글자로 취급한다", async () => {
  const [wildcardUser] = await db
    .insert(schema.users)
    .values({ kakaoId: "wildcard" })
    .returning({ id: schema.users.id });
  await db
    .insert(schema.userAlerts)
    .values({ userId: wildcardUser.id, keyword: "%", enabled: true });

  const ids = await findRecipients(db, OTHER, "유상증자결정");
  assert.ok(!ids.includes(wildcardUser.id));
});
