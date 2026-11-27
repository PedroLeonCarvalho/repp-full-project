-- 0015: store sheet music PDFs in the database instead of the server disk.
-- Rows in customer_musics and setlist_music reference sheet_music_files by id.
-- Legacy column sheet_music_file (path) is kept for now and is no longer written or read.
--
-- NOT YET REGISTERED in drizzle/meta/_journal.json and NOT YET APPLIED (same convention as 0012–0014).
-- Apply manually to the target database before deploying the code that uses it.
-- Old /uploads/... paths are not migrated: those files no longer exist.

CREATE TABLE IF NOT EXISTS "sheet_music_files" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "customer_id" uuid NOT NULL,
  "file_name" text NOT NULL,
  "size_bytes" integer NOT NULL,
  "sha256" text NOT NULL,
  "content" bytea NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "sheet_music_files"
    ADD CONSTRAINT "sheet_music_files_customer_id_customers_id_fk"
    FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "sheet_music_files_created_at_idx" ON "sheet_music_files" ("created_at");--> statement-breakpoint

ALTER TABLE "customer_musics" ADD COLUMN IF NOT EXISTS "sheet_music_file_id" uuid;--> statement-breakpoint
ALTER TABLE "setlist_music" ADD COLUMN IF NOT EXISTS "sheet_music_file_id" uuid;--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "customer_musics"
    ADD CONSTRAINT "customer_musics_sheet_music_file_id_fk"
    FOREIGN KEY ("sheet_music_file_id") REFERENCES "public"."sheet_music_files"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "setlist_music"
    ADD CONSTRAINT "setlist_music_sheet_music_file_id_fk"
    FOREIGN KEY ("sheet_music_file_id") REFERENCES "public"."sheet_music_files"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
