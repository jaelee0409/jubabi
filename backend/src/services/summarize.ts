import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "../config/env";
import { getDb } from "../config/db";
import { disclosures } from "../db/schema";
import { eq } from "drizzle-orm";
import { fetchDocument } from "../utils/parseDisclosure";

const client = new Anthropic({ apiKey: ENV.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `당신은 주식 투자자를 위한 공시 해설가입니다. 어려운 공시를 누구나 쉽게 이해할 수 있도록 설명해주세요.
전문 용어는 쉬운 말로 풀어쓰고, 숫자는 구체적으로 표현하세요.

반드시 아래 마크다운 형식을 정확히 지켜주세요:

## 한 줄 요약
(공시의 핵심을 쉬운 말로 한 문장으로)

## 무슨 일이 있었나요?
(무슨 일이 일어났는지 2~3문장으로 쉽게 설명. 전문 용어 사용 금지)

## 핵심 숫자
- **항목**: 값 (의미 한 줄)
- **항목**: 값 (의미 한 줄)

## 주가에 미치는 영향
👍 긍정 또는 👎 부정 또는 😐 중립

(왜 그런지 2~3문장으로 쉽게 설명)`;

export async function getOrCreateSummary(rcpNo: string): Promise<string> {
  const db = getDb();

  // 1. 캐시 확인
  const existing = await db.query.disclosures.findFirst({
    where: eq(disclosures.receiptNumber, rcpNo),
  });

  if (existing?.aiSummary) {
    return existing.aiSummary;
  }

  // 2. 공시 문서 fetch — 실패 시 요약 불가
  const docText = await fetchDocument(rcpNo);
  const userContent = `다음 공시 문서를 분석해주세요:\n\n${docText}`;

  // 3. Claude API 호출
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userContent }],
  });

  const summary =
    message.content[0].type === "text" ? message.content[0].text : "";

  // 4. DB에 캐시 저장
  await db
    .update(disclosures)
    .set({ aiSummary: summary, aiSummarizedAt: new Date() })
    .where(eq(disclosures.receiptNumber, rcpNo));

  return summary;
}
