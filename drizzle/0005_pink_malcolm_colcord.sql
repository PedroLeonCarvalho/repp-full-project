ALTER TABLE "concerts" ADD COLUMN "share_token" text;--> statement-breakpoint
ALTER TABLE "concerts" ADD COLUMN "is_share_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "concerts" ADD COLUMN "original_concert_id" uuid;--> statement-breakpoint
ALTER TABLE "concerts" ADD CONSTRAINT "concerts_original_concert_id_concerts_id_fk" FOREIGN KEY ("original_concert_id") REFERENCES "public"."concerts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concerts" ADD CONSTRAINT "concerts_share_token_unique" UNIQUE("share_token");