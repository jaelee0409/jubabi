import { Router } from "express";
import { getDb } from "../config/db";
import { userNotifications, disclosures } from "../db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";

const router = Router();

// GET /api/notifications
router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = getDb();

    const rows = await db
      .select({
        id: userNotifications.id,
        disclosedAt: userNotifications.createdAt,
        read: userNotifications.read,
        receiptNumber: userNotifications.disclosureReceiptNumber,
        title: disclosures.title,
        companyName: disclosures.companyName,
        market: disclosures.market,
        correctionType: disclosures.correctionType,
      })
      .from(userNotifications)
      .leftJoin(
        disclosures,
        eq(userNotifications.disclosureReceiptNumber, disclosures.receiptNumber)
      )
      .where(eq(userNotifications.userId, req.user!.userId))
      .orderBy(desc(userNotifications.createdAt));

    res.json(rows);
  } catch (err) {
    console.error("❌ Fetch notifications error:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// GET /api/notifications/unread
router.get("/unread", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = getDb();

    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const userId = req.user.userId;

    const result = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(userNotifications)
      .where(
        and(
          eq(userNotifications.userId, userId),
          eq(userNotifications.read, false)
        )
      );

    const unreadCount = result[0]?.count ?? 0;

    res.json({ unreadCount });
  } catch (err) {
    console.error("❌ Fetch notifications unread error:", err);
    res.status(500).json({ error: "Failed to fetch notifications unread" });
  }
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const notificationId = parseInt(req.params.id, 10);

    await db
      .update(userNotifications)
      .set({ read: true })
      .where(
        and(
          eq(userNotifications.id, notificationId),
          eq(userNotifications.userId, req.user!.userId)
        )
      );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Mark notification read error:", err);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

// PATCH /api/notifications/read-all
router.patch("/read-all", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = getDb();

    await db
      .update(userNotifications)
      .set({ read: true })
      .where(eq(userNotifications.userId, req.user!.userId));

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Mark all notifications read error:", err);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
});

export default router;
