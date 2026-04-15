
--> statement-breakpoint
CREATE TABLE "disclosures" (
	"rcept_no" varchar(14) PRIMARY KEY NOT NULL,
	"company_name" varchar NOT NULL,
	"title" varchar NOT NULL,
	"market" char(1) DEFAULT 'E' NOT NULL,
	"type" varchar,
	"disclosed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"company_corp_code" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_stock_favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"company_corp_code" varchar
);

--> statement-breakpoint
ALTER TABLE "user_alerts" ADD CONSTRAINT "user_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_alerts" ADD CONSTRAINT "user_alerts_company_corp_code_companies_corp_code_fk" FOREIGN KEY ("company_corp_code") REFERENCES "public"."companies"("corp_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stock_favorites" ADD CONSTRAINT "user_stock_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stock_favorites" ADD CONSTRAINT "user_stock_favorites_company_corp_code_companies_corp_code_fk" FOREIGN KEY ("company_corp_code") REFERENCES "public"."companies"("corp_code") ON DELETE no action ON UPDATE no action;