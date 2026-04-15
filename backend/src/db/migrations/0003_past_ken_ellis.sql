ALTER TABLE "user_alerts" DROP CONSTRAINT "user_alerts_company_corp_code_companies_corp_code_fk";
--> statement-breakpoint
ALTER TABLE "user_stock_favorites" DROP CONSTRAINT "user_stock_favorites_company_corp_code_companies_corp_code_fk";
--> statement-breakpoint
ALTER TABLE "user_alerts" ADD COLUMN "keyword" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "user_stock_favorites" ADD COLUMN "company_name" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "user_alerts" DROP COLUMN "company_corp_code";--> statement-breakpoint
ALTER TABLE "user_alerts" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "user_stock_favorites" DROP COLUMN "company_corp_code";