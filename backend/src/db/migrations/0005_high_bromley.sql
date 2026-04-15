CREATE TABLE "user_push_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"token" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "user_stock_favorites" RENAME COLUMN "company_name" TO "company_corp_code";--> statement-breakpoint
ALTER TABLE "disclosures" ADD COLUMN "company_corp_code" varchar(8);--> statement-breakpoint
ALTER TABLE "user_push_tokens" ADD CONSTRAINT "user_push_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disclosures" ADD CONSTRAINT "disclosures_company_corp_code_companies_corp_code_fk" FOREIGN KEY ("company_corp_code") REFERENCES "public"."companies"("corp_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stock_favorites" ADD CONSTRAINT "user_stock_favorites_company_corp_code_companies_corp_code_fk" FOREIGN KEY ("company_corp_code") REFERENCES "public"."companies"("corp_code") ON DELETE no action ON UPDATE no action;