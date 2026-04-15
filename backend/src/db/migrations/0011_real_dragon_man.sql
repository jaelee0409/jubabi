CREATE TABLE "user_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"disclosure_receipt_number" varchar(14) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"read" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_notifications"
ADD CONSTRAINT "user_notifications_user_id_users_id_fk"
FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
ON DELETE cascade ON UPDATE no action;

-- FK: disclosures.rcept_no (varchar(14))
ALTER TABLE "user_notifications"
ADD CONSTRAINT "user_notifications_disclosure_receipt_number_disclosures_rcept_no_fk"
FOREIGN KEY ("disclosure_receipt_number") REFERENCES "public"."disclosures"("rcept_no")
ON DELETE cascade ON UPDATE no action;