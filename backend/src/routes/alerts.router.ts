import { Router } from "express";
import { getDb } from "../config/db";
import { userAlerts, users } from "../db/schema";
import { eq, and, count } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";

const ALERT_LIMITS: Record<string, number> = {
  free: 2,
  premium: 10,
  lifetime: Infinity,
};

const router = Router();

// GET /api/alerts
router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const alerts = await db
      .select()
      .from(userAlerts)
      .where(eq(userAlerts.userId, req.user!.userId));
    res.json(alerts);
  } catch (err) {
    console.error("❌ Fetch alerts error:", err);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

// POST /api/alerts
router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  const { keyword } = req.body;
  if (!keyword || typeof keyword !== "string" || !keyword.trim()) {
    return res.status(400).json({ error: "키워드를 입력해주세요" });
  }

  try {
    const db = getDb();

    // 멤버십 한도 확인
    const user = await db.query.users.findFirst({ where: eq(users.id, req.user!.userId) });
    const limit = ALERT_LIMITS[user?.membership ?? "free"];
    const [{ value: alertCount }] = await db
      .select({ value: count() })
      .from(userAlerts)
      .where(eq(userAlerts.userId, req.user!.userId));

    if (alertCount >= limit) {
      return res.status(403).json({
        error: `알림은 최대 ${limit}개까지 등록할 수 있습니다. 더 많은 알림을 원하시면 업그레이드하세요.`,
        code: "LIMIT_EXCEEDED",
      });
    }

    // 중복 키워드 체크
    const existing = await db
      .select()
      .from(userAlerts)
      .where(and(eq(userAlerts.userId, req.user!.userId), eq(userAlerts.keyword, keyword.trim())));

    if (existing.length > 0) {
      return res.status(409).json({ error: "이미 등록된 키워드입니다" });
    }

    const [alert] = await db
      .insert(userAlerts)
      .values({ userId: req.user!.userId, keyword: keyword.trim(), enabled: true })
      .returning();

    res.status(201).json(alert);
  } catch (err) {
    console.error("❌ Create alert error:", err);
    res.status(500).json({ error: "Failed to create alert" });
  }
});

// PATCH /api/alerts/:id — enabled 토글
router.patch("/:id", authMiddleware, async (req: AuthRequest, res) => {
  const { enabled } = req.body;
  if (typeof enabled !== "boolean") {
    return res.status(400).json({ error: "enabled 값이 필요합니다" });
  }

  try {
    const db = getDb();
    const [updated] = await db
      .update(userAlerts)
      .set({ enabled })
      .where(and(eq(userAlerts.id, req.params.id), eq(userAlerts.userId, req.user!.userId)))
      .returning();

    if (!updated) return res.status(404).json({ error: "알림을 찾을 수 없습니다" });
    res.json(updated);
  } catch (err) {
    console.error("❌ Update alert error:", err);
    res.status(500).json({ error: "Failed to update alert" });
  }
});

// DELETE /api/alerts/:id
router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const [deleted] = await db
      .delete(userAlerts)
      .where(and(eq(userAlerts.id, req.params.id), eq(userAlerts.userId, req.user!.userId)))
      .returning();

    if (!deleted) return res.status(404).json({ error: "알림을 찾을 수 없습니다" });
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Delete alert error:", err);
    res.status(500).json({ error: "Failed to delete alert" });
  }
});

export default router;
