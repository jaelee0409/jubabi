ALTER TABLE "user_push_tokens" DROP CONSTRAINT "user_push_tokens_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_stock_favorites" DROP CONSTRAINT "user_stock_favorites_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_notifications" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_push_tokens" ADD CONSTRAINT "user_push_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stock_favorites" ADD CONSTRAINT "user_stock_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;