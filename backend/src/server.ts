import { loadProdEnv } from "./config/loadConfig";
import { initDb } from "./config/db";
import { ENV } from "./config/env";
import { startRssPoller } from "./jobs/rssPoller";
import { companiesCache } from "./cache/companiesCache";
import app from "./app";
import "./jobs/scheduler";

async function bootstrap() {
  await loadProdEnv();
  initDb();
  await companiesCache.load();

  const PORT_NUMBER = Number(ENV.PORT);
  app.listen(PORT_NUMBER, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT_NUMBER}`);
  });

  startRssPoller();
}

bootstrap().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});

// (옵션) 종료 시그널 처리
process.on("SIGINT", () => {
  console.log("Shutting down...");
  process.exit(0);
});

// app.get("/api/companies/:stockCode", async (req, res) => {
//   const company = await db.query.companies.findFirst({
//     where: eq(companies.stockCode, req.params.stockCode),
//     with: {
//       recentDisclosures: {
//         orderBy: desc(disclosures.disclosedAt),
//         limit: 10,
//       },
//     },
//   });

//   if (!company) {
//     return res.status(404).json({ error: "Company not found" });
//   }

//   res.status(200).json(company);
// });

// import cors from "cors";
// import { and, desc, eq, gte, inArray, lte, SQL } from "drizzle-orm";
// import express from "express";
// import cron from "node-cron";
// import { db } from "./config/db";
// import { ENV } from "./config/env";
// import { companies, disclosures, users, userStockFavorites } from "./db/schema";
// import companyRoutes from "./routes/companyRoutes";
// import kiwoomRouter from "./routes/kiwoom.router";
// import { fetchRecentDisclosuresAndInsertDB } from "./scripts/dart";
// import { seedCompanies } from "./scripts/seedCompanies";

// const app = express();
// const PORT = ENV.PORT;
// const BACKEND_BASE_URL = ENV.BACKEND_BASE_URL;

// app.use(cors());
// app.use(express.json());

// // Job 1: Fetch DART data every weekday at 7 AM
// cron.schedule("0 7 * * 1-5", seedCompanies, {
//   timezone: "Asia/Seoul", // Adjust to your timezone
// });

// // Job 2: Fetch DART recent disclosure data every minute
// cron.schedule("*/1 7-19 * * 1-5", fetchRecentDisclosuresAndInsertDB, {
//   timezone: "Asia/Seoul",
// });

// app.get("/", (_req, res) => {
//   res.send("Hello Disclosure App!");
// });

// app.get("/api/users/:id", async (req, res) => {
//   const user = await db.query.users.findFirst({
//     where: eq(users.id, req.params.id),
//     columns: {
//       id: true,
//       email: true,
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

// app.use("/api/companies", companyRoutes);
// app.use("/api/kiwoom", kiwoomRouter);

// // app.get("/api/companies/:stockCode", async (req, res) => {
// //   const company = await db.query.companies.findFirst({
// //     where: eq(companies.stockCode, req.params.stockCode),
// //     with: {
// //       recentDisclosures: {
// //         orderBy: desc(disclosures.disclosedAt),
// //         limit: 10,
// //       },
// //     },
// //   });

// //   if (!company) {
// //     return res.status(404).json({ error: "Company not found" });
// //   }

// //   res.status(200).json(company);
// // });

// app.get("/api/disclosures", async (req, res) => {
//   try {
//     const { page = 1, limit = 20 } = req.query;

//     const pageNum = Number(page);
//     const limitNum = Number(limit);
//     const offset = (pageNum - 1) * limitNum;

//     const whereConditions = [];
//     // if (type) whereConditions.push(eq(disclosures.type, type));
//     whereConditions.push(
//       inArray(
//         disclosures.companyStockCode,
//         db.select({ stockCode: companies.stockCode }).from(companies)
//       )
//     );

//     const result = await db.query.disclosures.findMany({
//       where: and(...whereConditions),
//       orderBy: desc(disclosures.disclosedAt),
//       offset: offset,
//       limit: Number(limit),
//       with: {
//         company: true, // 회사 정보 함께 로드
//       },
//     });

//     res.status(200).json(result);
//   } catch (error) {
//     console.error("Error fetching disclosures:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// // app.get("/api/disclosures/:receiptNumber", async (req, res) => {
// //   const { receiptNumber } = req.params;

// //   const disclosure = await db.query.disclosures.findFirst({
// //     where: eq(disclosures.receiptNumber, receiptNumber),
// //     // with: {
// //     //   company: true,
// //     //   attachments: true // 공시 첨부파일 정보
// //     // }
// //   });

// //   if (!disclosure) {
// //     return res.status(404).json({ error: "Disclosure not found" });
// //   }

// //   res.status(200).json(disclosure);
// // });

// app.get("/api/disclosures/company/:stockCode", async (req, res) => {
//   const { stockCode } = req.params;
//   //const { filter } = req.query; // 나중에 사용할 파라미터 (예: "3m", "6m", "1y")

//   // 오늘 날짜 기준으로 3개월 전 계산
//   const today = new Date();
//   const threeMonthsAgo = new Date();
//   threeMonthsAgo.setMonth(today.getMonth() - 3);

//   const conditions: SQL[] = [
//     eq(disclosures.companyStockCode, stockCode),
//     gte(disclosures.disclosedAt, threeMonthsAgo),
//     lte(disclosures.disclosedAt, today),
//   ];

//   const result = await db.query.disclosures.findMany({
//     where: and(...conditions),
//     orderBy: desc(disclosures.disclosedAt),
//     // with: {
//     //     company: true // 회사 정보 함께 로드
//     //   }
//   });

//   res.status(200).json(result);
// });

// app.get("/api/favorites/:userId", async (req, res) => {
//   try {
//     const { userId } = req.params;

//     if (!userId) {
//       return res.status(400).json({ error: "User ID is required" });
//     }

//     const userFavorites = await db
//       .select()
//       .from(userStockFavorites)
//       .where(eq(userStockFavorites.userId, userId));

//     res.status(200).json(userFavorites);
//   } catch (error) {
//     console.error("Error fetching favorites:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// app.post("/api/favorites", async (req, res) => {
//   try {
//     const { userId, companyStockCode } = req.body;

//     if (!userId || !companyStockCode) {
//       return res
//         .status(400)
//         .json({ error: "User ID and Company Stock Code are required" });
//     }

//     const newFavorite = await db
//       .insert(userStockFavorites)
//       .values({
//         userId,
//         companyStockCode,
//       })
//       .returning();

//     res.status(201).json(newFavorite[0]);
//   } catch (error) {
//     console.error("Error adding favorite:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// app.delete("/api/favorites/:userId/:companyStockCode", async (req, res) => {
//   try {
//     const { userId, companyStockCode } = req.params;

//     if (!userId || !companyStockCode) {
//       return res
//         .status(400)
//         .json({ error: "User ID and Company Stock Code are required" });
//     }

//     await db
//       .delete(userStockFavorites)
//       .where(
//         and(
//           eq(userStockFavorites.userId, userId),
//           eq(userStockFavorites.companyStockCode, companyStockCode)
//         )
//       );

//     res.status(200).json({ message: "Favorite removed successfully" });
//   } catch (error) {
//     console.error("Error deleting favorite:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Server is running on ${BACKEND_BASE_URL}:${PORT}`);
// });
