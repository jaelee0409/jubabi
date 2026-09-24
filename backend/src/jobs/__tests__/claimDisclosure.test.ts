import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import * as schema from "../../db/schema";
import { claimDisclosure } from "../claimDisclosure";
import { createTestDb } from "./testDb";

let t: Awaited<ReturnType<typeof createTestDb>>;

const CORP = "00126380";
const disclosure = (receiptNumber: string) => ({
  receiptNumber,
  title: "단일판매ㆍ공급계약체결",
  companyName: "삼성전자",
  companyCorpCode: CORP,
});

before(async () => {
  t = await createTestDb();
  await t.db
    .insert(schema.companies)
    .values({ corpCode: CORP, name: "삼성전자", stockCode: "005930" });
});

after(async () => {
  await t.client.close();
});

test("처음 저장하면 true, 이미 있는 공시면 false", async () => {
  assert.equal(await claimDisclosure(t.db, disclosure("20260101000001")), true);
  // 재시작으로 메모리 캐시가 비어 같은 공시를 다시 본 상황
  assert.equal(await claimDisclosure(t.db, disclosure("20260101000001")), false);
});

test("폴링이 겹쳐 같은 공시를 동시에 저장해도 true는 한 번만 나온다", async () => {
  const results = await Promise.all(
    Array.from({ length: 3 }, () =>
      claimDisclosure(t.db, disclosure("20260101000002"))
    )
  );
  assert.equal(results.filter(Boolean).length, 1);
});
