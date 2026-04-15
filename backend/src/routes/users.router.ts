import { eq, and } from "drizzle-orm";
import { Router } from "express";
import { userPushTokens, users } from "../db/schema";
import {
  authMiddleware,
  AuthRequest,
  requireUser,
} from "../middleware/authMiddleware";
import { getDb } from "../config/db";

const router = Router();

// router.get("/:id", async (req, res) => {
//   const user = await db.query.users.findFirst({
//     where: eq(users.id, req.params.id),
//     columns: {
//       id: true,
//       createdAt: true,
//     },
//     // with: {
//     //   alerts: {
//     //     with: { company: true },
//     //     limit: 5 // 최근 알림 5개만
//     //   }
//     // }
//   });

//   res.status(200).json(user);
// });

router.post("/push-token", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { pushToken, deviceInfo } = req.body;
    if (!pushToken) {
      return res.status(400).json({ error: "Missing push token" });
    }

    // 중복 확인
    requireUser(req);
    const db = getDb();
    const existing = await db
      .select()
      .from(userPushTokens)
      .where(
        and(
          eq(userPushTokens.userId, req.user.userId),
          eq(userPushTokens.token, pushToken)
        )
      );

    if (existing.length === 0) {
      await db.insert(userPushTokens).values({
        userId: req.user.userId,
        token: pushToken,
        deviceInfo: deviceInfo ?? null,
      });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("❌ Failed to save push token:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
