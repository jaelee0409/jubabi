import cors from "cors";
import express from "express";
import { ENV } from "./config/env";

import authRouter from "./routes/auth.router";
import companiesRouter from "./routes/companies.router";
import disclosuresRouter from "./routes/disclosures.router";
import favoritesRouter from "./routes/favorites.router";
import bookmarksRouter from "./routes/bookmarks.router";
// import kiwoomRouter from "./routes/kiwoom.router";
import usersRouter from "./routes/users.router";
import notificationsRouter from "./routes/notifications.router";
import alertsRouter from "./routes/alerts.router";

const app = express();

// 미들웨어
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  const now = new Date().toISOString();
  console.log(
    `🚀 Health check hit @ ${now} | env=${ENV.NODE_ENV} | ip=${_req.ip}`
  );
  res.json({ status: "ok", time: now });
});

import { readFileSync } from "fs";

app.get("/test-rss", (req, res) => {
  const xml = readFileSync("./testRSS.xml", "utf8");
  res.type("application/xml").send(xml);
});

// // 라우터
app.use("/auth", authRouter);
app.use("/api/companies", companiesRouter);
// app.use("/api/kiwoom", kiwoomRouter);
app.use("/api/disclosures", disclosuresRouter);
app.use("/api/users", usersRouter);
app.use("/api/favorites", favoritesRouter);
app.use("/api/bookmarks", bookmarksRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/alerts", alertsRouter);

export default app;
