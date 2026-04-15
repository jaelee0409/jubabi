CREATE TABLE "user_bookmarks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"disclosure_receipt_number" varchar(14) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "user_alerts" DROP CONSTRAINT "user_alerts_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "disclosures" ALTER COLUMN "company_corp_code" SET NOT NULL;--> statement-breakpoint
-- ALTER TABLE "user_alerts" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
-- ALTER TABLE "user_alerts" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_alerts" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_alerts" ALTER COLUMN "keyword" DROP NOT NULL;--> statement-breakpoint
-- ALTER TABLE "user_stock_favorites" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "user_stock_favorites" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_stock_favorites" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_alerts" ADD COLUMN "category" varchar;--> statement-breakpoint
ALTER TABLE "user_alerts" ADD COLUMN "type" varchar;--> statement-breakpoint
ALTER TABLE "user_alerts" ADD COLUMN "last_triggered_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_alerts" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_stock_favorites" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_bookmarks" ADD CONSTRAINT "user_bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_bookmarks" ADD CONSTRAINT "user_bookmarks_disclosure_receipt_number_disclosures_rcept_no_fk" FOREIGN KEY ("disclosure_receipt_number") REFERENCES "public"."disclosures"("rcept_no") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_alerts" ADD CONSTRAINT "user_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;