ALTER TABLE "user_push_tokens" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_push_tokens" ADD COLUMN "device_info" varchar;