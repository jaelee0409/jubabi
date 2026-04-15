import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";
import { users } from "../db/schema";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";
import { getDb } from "../config/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = req.user.userId; // from JWT middleware

  const db = getDb();
  const dbUser = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, userId),
  });
  res.json({
    nickname: dbUser?.nickname ?? null,
    thumbnailUrl: dbUser?.thumbnailUrl ?? null,
    membership: dbUser?.membership,
    createdAt: dbUser?.createdAt,
  });
});

// /auth/kakao
router.get("/kakao", async (req, res) => {
  const redirectUri = `${ENV.BACKEND_BASE_URL}/auth/kakao/callback`;
  const authUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${
    ENV.KAKAO_REST_API_KEY
  }&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
  res.redirect(authUrl);
});

// /auth/kakao/callback
router.get("/kakao/callback", async (req, res) => {
  const code = req.query.code as string;

  //1. Exchange code → access_token
  const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: ENV.KAKAO_REST_API_KEY!,
      redirect_uri: `${ENV.BACKEND_BASE_URL}/auth/kakao/callback`,
      code,
      client_secret: ENV.KAKAO_CLIENT_SECRET ?? "",
    }),
  });
  const tokenJson = await tokenRes.json();

  // 2. Get user profile from Kakao
  const profileRes = await fetch("https://kapi.kakao.com/v2/user/me", {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  const profile = await profileRes.json();
  const kakaoId = profile.id.toString();

  let nickname: string | undefined;
  let thumbnailUrl: string | undefined;

  if (
    profile.kakao_account &&
    profile.kakao_account.profile &&
    !profile.kakao_account.profile_nickname_needs_agreement
  ) {
    nickname = profile.kakao_account.profile.nickname;
  }
  if (
    profile.kakao_account &&
    profile.kakao_account.profile &&
    !profile.kakao_account.profile_image_needs_agreement
  ) {
    thumbnailUrl = profile.kakao_account.profile.thumbnail_image_url;
  }

  // 3. Upsert user into DB
  const db = getDb();
  let user = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.kakaoId, kakaoId),
  });

  try {
    user = await db
      .insert(users)
      .values({ kakaoId, membership: "free", nickname, thumbnailUrl })
      .onConflictDoUpdate({
        target: users.kakaoId,
        set: { nickname, thumbnailUrl },
      })
      .returning()
      .then((rows) => rows[0]);
  } catch (err) {
    console.error("Error creating/updating user", err);
    return res.status(500).json({ error: "Database error" });
  }

  // 4. Create JWT
  const appToken = jwt.sign({ userId: user!.id }, ENV.JWT_SECRET!, {
    expiresIn: "7d",
  });

  // 5. Redirect back to app with JWT
  if (ENV.NODE_ENV === "development") {
    res.redirect(
      302,
      `jubabi-dev://redirect?token=${encodeURIComponent(appToken)}`
    );
  }
  if (ENV.NODE_ENV === "preview") {
    res.redirect(
      302,
      `jubabi-preview://redirect?token=${encodeURIComponent(appToken)}`
    );
  } else {
    res.redirect(
      302,
      `jubabi://redirect?token=${encodeURIComponent(appToken)}`
    );
  }
});

// /auth/unlink
router.delete("/unlink", authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const db = getDb();

  // 1. 카카오 Admin API로 unlink
  if (ENV.KAKAO_ADMIN_KEY) {
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    if (dbUser?.kakaoId) {
      try {
        await fetch("https://kapi.kakao.com/v1/user/unlink", {
          method: "POST",
          headers: {
            Authorization: `KakaoAK ${ENV.KAKAO_ADMIN_KEY}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ target_id_type: "user_id", target_id: dbUser.kakaoId }),
        });
      } catch {
        // 카카오 unlink 실패해도 DB 삭제는 진행
      }
    }
  }

  // 2. DB에서 유저 삭제 (cascade로 관련 데이터 모두 삭제)
  await db.delete(users).where(eq(users.id, userId));

  return res.json({ success: true });
});

// POST /auth/verify-purchase — Google Play 구매 검증 후 멤버십 업그레이드
router.post("/verify-purchase", authMiddleware, async (req: AuthRequest, res) => {
  const { productId, purchaseToken } = req.body;
  if (!productId || !purchaseToken) {
    return res.status(400).json({ error: "productId와 purchaseToken이 필요합니다." });
  }

  const db = getDb();

  // productId로 membership tier 결정
  const membershipMap: Record<string, "premium" | "lifetime"> = {
    "com.jubabi.premium.monthly": "premium",
    "com.jubabi.lifetime": "lifetime",
  };

  const membership = membershipMap[productId];
  if (!membership) {
    return res.status(400).json({ error: "유효하지 않은 상품입니다." });
  }

  // TODO: Google Play Developer API로 purchaseToken 서버 검증 추가 가능
  // 지금은 클라이언트에서 성공한 구매를 신뢰하고 업그레이드
  await db
    .update(users)
    .set({ membership })
    .where(eq(users.id, req.user!.userId));

  res.json({ success: true, membership });
});

export default router;
