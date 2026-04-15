import { Router } from "express";
import { getRecentDisclosures } from "../services/disclosures.service";
import { fetchDocument } from "../utils/parseDisclosure";
import { getDb } from "../config/db";
import { disclosures, users } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";
import { getOrCreateSummary } from "../services/summarize";

const router = Router();

// GET /api/disclosures/recent?limit=20&offset=0&category=CAPITAL
router.get("/recent", async (req, res) => {
  const limit = parseInt(req.query.limit as string, 10) || 20;
  const offset = parseInt(req.query.offset as string, 10) || 0;
  const category = req.query.category as string | undefined;

  try {
    const rows = await getRecentDisclosures(limit, offset, category);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching recent disclosures:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/:rcpNo", async (req, res) => {
  try {
    const parsed = await fetchDocument(req.params.rcpNo);
    res.json(parsed);
  } catch (err: any) {
    console.error("Fetch disclosure error:", err);
    res.status(500).json({ error: "Failed to fetch disclosure document" });
  }
});

router.get("/company/:companyCorpCode", async (req, res) => {
  try {
    const { companyCorpCode } = req.params;

    const db = getDb();
    const rows = await db
      .select()
      .from(disclosures)
      .where(eq(disclosures.companyCorpCode, companyCorpCode))
      .orderBy(desc(disclosures.disclosedAt));

    res.json(rows);
  } catch (err: any) {
    console.error("❌ Fetch disclosure error:", err);
    res.status(500).json({ error: "Failed to fetch disclosures" });
  }
});

// GET /api/disclosures/:rcpNo/summary — 프리미엄 전용
router.get("/:rcpNo/summary", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = getDb();

    // 프리미엄 여부 확인
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user!.userId),
    });

    if (!user || user.membership === "free") {
      return res.status(403).json({ error: "프리미엄 회원 전용 기능입니다." });
    }

    const summary = await getOrCreateSummary(req.params.rcpNo);
    res.json({ summary });
  } catch (err: any) {
    console.error("❌ AI summary error:", err);
    res.status(500).json({ error: "요약 생성에 실패했습니다." });
  }
});

export default router;
