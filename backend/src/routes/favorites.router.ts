import { and, count, eq } from "drizzle-orm";
import { Router } from "express";
import { users, userStockFavorites } from "../db/schema";
import {
  authMiddleware,
  AuthRequest,
  requireUser,
} from "../middleware/authMiddleware";
import { getDb } from "../config/db";
import { companiesCache } from "../cache/companiesCache";

const FAVORITES_LIMIT: Record<string, number> = {
  free: 5,
  premium: 30,
  lifetime: Infinity,
};

const router = Router();

// GET /api/favorites
router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  requireUser(req);
  const db = getDb();
  const favorites = await db
    .select()
    .from(userStockFavorites)
    .where(eq(userStockFavorites.userId, req.user.userId));

  // Enrich with company info from cache
  const enriched = favorites.map((fav) => {
    const company = companiesCache.getByCorpCode(fav.companyCorpCode);

    return {
      ...fav,
      companyName: company?.name ?? null,
      stockCode: company?.stockCode ?? null,
    };
  });

  res.json(enriched);
});

// POST /api/favorites
router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  const { corpCode } = req.body;

  if (!corpCode) {
    return res.status(400).json({ error: "Corp code is required" });
  }

  const company = companiesCache.getByCorpCode(corpCode);
  if (!company) {
    return res.status(404).json({ error: "Invalid corp code" });
  }

  requireUser(req);
  const db = getDb();
  try {
    // ✅ 2. 중복 방지
    const exists = await db.query.userStockFavorites.findFirst({
      where: (fav, { eq, and }) =>
        and(eq(fav.userId, req.user.userId), eq(fav.companyCorpCode, corpCode)),
    });

    if (exists) {
      return res.status(409).json({ error: "Already in favorites" });
    }

    // ✅ 3. 멤버십 한도 확인
    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, req.user.userId),
      columns: { membership: true },
    });

    const membership = user?.membership ?? "free";
    const limit = FAVORITES_LIMIT[membership] ?? FAVORITES_LIMIT.free;

    if (limit !== Infinity) {
      const [{ value: currentCount }] = await db
        .select({ value: count() })
        .from(userStockFavorites)
        .where(eq(userStockFavorites.userId, req.user.userId));

      if (currentCount >= limit) {
        return res.status(403).json({
          error: `관심 종목은 최대 ${limit}개까지 등록할 수 있습니다. 멤버십을 업그레이드하면 더 많이 추가할 수 있습니다.`,
        });
      }
    }

    // ✅ 5. 삽입
    const inserted = await db
      .insert(userStockFavorites)
      .values({
        userId: req.user.userId,
        companyCorpCode: corpCode,
      })
      .returning();

    // ✅ 6. companyName, stockCode 붙여서 응답
    res.json({
      ...inserted[0],
      companyName: company.name,
      stockCode: company.stockCode,
    });
  } catch (error) {
    console.error("Error adding favorite:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE /api/favorites/:corpCode
router.delete("/:corpCode", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { corpCode } = req.params;

    if (!corpCode) {
      return res.status(400).json({ error: "Corp code is required" });
    }

    requireUser(req);
    const db = getDb();
    const result = await db
      .delete(userStockFavorites)
      .where(
        and(
          eq(userStockFavorites.userId, req.user.userId),
          eq(userStockFavorites.companyCorpCode, corpCode)
        )
      )
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: "Favorite not found" });
    }

    res.status(200).json({ message: "Favorite removed successfully" });
  } catch (error) {
    console.error("Error deleting favorite:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
