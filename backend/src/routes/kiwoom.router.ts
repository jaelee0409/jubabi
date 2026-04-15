// import { Router } from "express";
// import { getAccessToken } from "../services/kiwoom/tokenManager";

// const router = Router();

// /**
//  * GET /api/kiwoom/token
//  * - 키움 REST API 접근 토큰 발급
//  * - 주의: 토큰은 서버에서만 관리하고, 프론트에 직접 노출하지 않는 게 안전
//  */
// router.get("/token", async (_req, res) => {
//   try {
//     const token = await getAccessToken();
//     res.json({ ok: true, length: token.length });
//   } catch (err: any) {
//     console.error("키움 토큰 발급 실패:", err?.message || err);
//     res.status(500).json({ error: "Failed to get Kiwoom token" });
//   }
// });

// /**
//  * 예시) 시세 프록시
//  * GET /api/kiwoom/price/:code
//  * - 클라이언트는 백엔드만 호출하고, 백엔드는 캐싱된 토큰으로 키움 REST API 호출
//  */
// // router.get("/stock/:stockCode", async (req, res) => {
// //   try {
// //     const { stockCode } = req.params;
// //     if (!stockCode) {
// //       return res.status(400).json({ error: "Stock code is required" });
// //     }

// //     const data = await getStockInfo(stockCode);
// //     res.json({
// //       stockCode,
// //       currentPrice: data.cur_prc ?? null,
// //       raw: data, // 원하면 전체 응답도 같이 내려줌
// //     });
// //   } catch (err: any) {
// //     res.status(500).json({ error: err?.message || "Internal Server Error" });
// //   }
// // });

// export default router;
