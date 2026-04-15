import {
  boolean,
  char,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  kakaoId: varchar("kakao_id").unique(),
  nickname: varchar("nickname"),
  thumbnailUrl: text("thumbnail_url"),
  membership: varchar("membership", { length: 10 })
    .notNull()
    .default("free") // 'free' 또는 'premium'
    .$type<"free" | "premium" | "lifetime">(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userPushTokens = pgTable("user_push_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  token: varchar("token").notNull(),
  deviceInfo: varchar("device_info"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userAlerts = pgTable("user_alerts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  keyword: varchar("keyword"),
  category: varchar("category"),
  type: varchar("type"),
  enabled: boolean("enabled").notNull().default(true),
  lastTriggeredAt: timestamp("last_triggered_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userStockFavorites = pgTable("user_stock_favorites", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  companyCorpCode: varchar("company_corp_code", { length: 8 })
    .references(() => companies.corpCode)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userNotifications = pgTable("user_notifications", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  disclosureReceiptNumber: varchar("disclosure_receipt_number", { length: 14 })
    .references(() => disclosures.receiptNumber, { onDelete: "cascade" })
    .notNull(),
  // companyName: varchar("company_name")
  //   .references(() => disclosures.receiptNumber, { onDelete: "cascade" })
  //   .notNull(),
  //   title: varchar("title"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userBookmarks = pgTable("user_bookmarks", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  disclosureReceiptNumber: varchar("disclosure_receipt_number", { length: 14 })
    .references(() => disclosures.receiptNumber, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const companies = pgTable("companies", {
  corpCode: varchar("corp_code", { length: 8 }).primaryKey(),
  stockCode: varchar("stock_code", { length: 6 }),
  name: varchar("name", { length: 100 }).notNull(),
  market: char("market"), // e.g. KOSPI, KOSDAQ
  listed: boolean("listed"),
});

export const disclosures = pgTable("disclosures", {
  receiptNumber: varchar("rcept_no", { length: 14 }).primaryKey(),
  companyName: varchar("company_name").notNull(),
  companyCorpCode: varchar("company_corp_code", { length: 8 })
    .references(() => companies.corpCode)
    .notNull(),
  title: varchar("title").notNull(),
  market: char("market", { length: 1 }).notNull().default("E"), // Y(유가), K(코스닥), N(코넥스), E(기타)
  category: varchar("category"), // 자본 구조 변화, 주주 환원 정책, 지분 구조, etc...
  type: varchar("type"), // 단일판매 공급계약체결, 자기주식취득결정, 자기주식취득신탁계약결정, 주식소각결정, 유상증자결정, etc...
  correctionType: varchar("correction_type"), // 기재정정, 발행조건확정, 변경등록, 첨부정정, etc...
  disclosedAt: timestamp("disclosed_at").defaultNow(),
  aiSummary: text("ai_summary"), // 캐시된 AI 요약
  aiSummarizedAt: timestamp("ai_summarized_at"),
});
