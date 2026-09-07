-- Step 1: Create music_catalog table
CREATE TABLE IF NOT EXISTS "music_catalog" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "artist" text NOT NULL,
  "lyrics" text,
  "chords" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "music_catalog_title_artist_unique" UNIQUE("title","artist")
);--> statement-breakpoint

-- Step 2: Populate music_catalog from distinct (title, artist) pairs in musics
-- Uses DISTINCT ON to pick one lyrics value per (title, artist) pair
INSERT INTO "music_catalog" ("title", "artist", "lyrics")
SELECT DISTINCT ON (lower(title), lower(artist)) title, artist, lyrics
FROM "musics"
ORDER BY lower(title), lower(artist), created_at ASC
ON CONFLICT ("title", "artist") DO NOTHING;--> statement-breakpoint

-- Step 3: Add music_catalog_id column to musics (nullable first for population)
ALTER TABLE "musics" ADD COLUMN "music_catalog_id" uuid;--> statement-breakpoint

-- Step 4: Populate the FK by matching on lower(title) + lower(artist)
UPDATE "musics" m
SET "music_catalog_id" = mc."id"
FROM "music_catalog" mc
WHERE lower(m."title") = lower(mc."title")
  AND lower(m."artist") = lower(mc."artist");--> statement-breakpoint

-- Step 5: Add chords override column to musics (customer-level override)
ALTER TABLE "musics" ADD COLUMN "chords" text;--> statement-breakpoint

-- Step 6: Set music_catalog_id NOT NULL
ALTER TABLE "musics" ALTER COLUMN "music_catalog_id" SET NOT NULL;--> statement-breakpoint

-- Step 7: Add FK constraint
ALTER TABLE "musics" ADD CONSTRAINT "musics_music_catalog_id_music_catalog_id_fk" FOREIGN KEY ("music_catalog_id") REFERENCES "public"."music_catalog"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;--> statement-breakpoint

-- Step 8: Drop title and artist columns from musics (data safely in music_catalog)
ALTER TABLE "musics" DROP COLUMN "title";--> statement-breakpoint
ALTER TABLE "musics" DROP COLUMN "artist";--> statement-breakpoint

-- Step 9: Drop old unique constraint (title+artist per customer) and add new one
ALTER TABLE "musics" DROP CONSTRAINT IF EXISTS "musics_customer_title_artist_unique";--> statement-breakpoint
ALTER TABLE "musics" ADD CONSTRAINT "musics_customer_catalog_unique" UNIQUE("customer_id","music_catalog_id");--> statement-breakpoint

-- Step 10: Rename table musics → customer_musics
ALTER TABLE "musics" RENAME TO "customer_musics";--> statement-breakpoint

-- Step 11: Update constraint names to reflect new table name
ALTER TABLE "customer_musics" RENAME CONSTRAINT "musics_customer_id_customers_id_fk" TO "customer_musics_customer_id_customers_id_fk";--> statement-breakpoint
ALTER TABLE "customer_musics" RENAME CONSTRAINT "musics_music_catalog_id_music_catalog_id_fk" TO "customer_musics_music_catalog_id_music_catalog_id_fk";--> statement-breakpoint
ALTER TABLE "customer_musics" RENAME CONSTRAINT "musics_customer_catalog_unique" TO "customer_musics_customer_catalog_unique";--> statement-breakpoint

-- Step 12: Update setlist_items FK (the FK references musics.id, table renamed, PK id stays)
-- PostgreSQL automatically renames FK references when the referenced table is renamed.
-- Explicitly rename the constraint on setlist_items for clarity if needed:
-- (No action needed — FK still valid after table rename)

-- Step 13: Update project_musics FK (same — no action needed)
