import { and, desc, eq } from "drizzle-orm";
import { Router } from "express";
import { disclosures, userBookmarks } from "../db/schema";
import {
  authMiddleware,
  AuthRequest,
  requireUser,
} from "../middleware/authMiddleware";
import { getDb } from "../config/db";

const router = Router();

// GET /api/bookmarks
router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  requireUser(req);
  const db = getDb();
  const results = await db
    .select({
      receiptNumber: disclosures.receiptNumber,
      title: disclosures.title,
      companyName: disclosures.companyName,
      companyCorpCode: disclosures.companyCorpCode,
      disclosedAt: disclosures.disclosedAt,
      market: disclosures.market,
      category: disclosures.category,
      type: disclosures.type,
      correctionType: disclosures.correctionType,
    })
    .from(userBookmarks)
    .innerJoin(
      disclosures,
      eq(userBookmarks.disclosureReceiptNumber, disclosures.receiptNumber)
    )
    .where(eq(userBookmarks.userId, req.user.userId))
    .orderBy(desc(userBookmarks.createdAt));

  res.json(results);
});

// POST /api/bookmarks
router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  const { receiptNumber } = req.body;
  if (!receiptNumber) {
    return res.status(400).json({ error: "receiptNumber is required" });
  }

  requireUser(req);
  const db = getDb();

  const exists = await db.query.userBookmarks.findFirst({
    where: (b, { eq, and }) =>
      and(
        eq(b.userId, req.user.userId),
        eq(b.disclosureReceiptNumber, receiptNumber)
      ),
  });

  if (exists) {
    return res.status(409).json({ error: "Already bookmarked" });
  }

  const inserted = await db
    .insert(userBookmarks)
    .values({ userId: req.user.userId, disclosureReceiptNumber: receiptNumber })
    .returning();

  res.json(inserted[0]);
});

// DELETE /api/bookmarks/:receiptNumber
router.delete("/:receiptNumber", authMiddleware, async (req: AuthRequest, res) => {
  const { receiptNumber } = req.params;
  requireUser(req);
  const db = getDb();

  const result = await db
    .delete(userBookmarks)
    .where(
      and(
        eq(userBookmarks.userId, req.user.userId),
        eq(userBookmarks.disclosureReceiptNumber, receiptNumber)
      )
    )
    .returning();

  if (result.length === 0) {
    return res.status(404).json({ error: "Bookmark not found" });
  }

  res.json({ message: "Bookmark removed" });
});

export default router;
