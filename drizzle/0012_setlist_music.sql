-- 0012: setlist_music (per-concert song copies), removal of music_catalog and setlist_items
-- Plan: docs/setlist-music-plan.md
--
-- NOT YET REGISTERED in drizzle/meta/_journal.json. Register it only after Phase A
-- (migration history repair) is complete for the target environment.
-- Preconditions: 0006–0011 applied. Run the precondition checks in the plan first.

-- Step 1: Backups (kept until the next release)
CREATE TABLE IF NOT EXISTS "setlist_items_backup" AS SELECT * FROM "setlist_items";--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customer_musics_backup" AS SELECT * FROM "customer_musics";--> statement-breakpoint

-- Step 2: Make customer_musics self-contained (title, artist, resolved lyrics/chords)
ALTER TABLE "customer_musics" ADD COLUMN IF NOT EXISTS "title" text;--> statement-breakpoint
ALTER TABLE "customer_musics" ADD COLUMN IF NOT EXISTS "artist" text;--> statement-breakpoint

UPDATE "customer_musics" cm
SET "title" = mc."title",
    "artist" = mc."artist",
    "lyrics" = COALESCE(cm."lyrics", mc."canonical_lyrics"),
    "chords" = COALESCE(cm."chords", mc."canonical_chords")
FROM "music_catalog" mc
WHERE mc."id" = cm."music_catalog_id";--> statement-breakpoint

ALTER TABLE "customer_musics" ALTER COLUMN "title" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_musics" ALTER COLUMN "artist" SET NOT NULL;--> statement-breakpoint

-- Step 3: Create setlist_music
CREATE TABLE "setlist_music" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "concert_id" uuid NOT NULL,
  "source_customer_music_id" uuid,
  "position" integer NOT NULL,
  "note" text,
  "title" text NOT NULL,
  "artist" text NOT NULL,
  "lyrics" text,
  "chords" text,
  "original_key" "musical_key",
  "preferred_key" "musical_key",
  "studying" boolean DEFAULT false NOT NULL,
  "genre" "music_genre",
  "genres" text[],
  "spotify_link" text,
  "sheet_music_file" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "setlist_music" ADD CONSTRAINT "setlist_music_concert_id_concerts_id_fk" FOREIGN KEY ("concert_id") REFERENCES "public"."concerts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setlist_music" ADD CONSTRAINT "setlist_music_source_customer_music_id_customer_musics_id_fk" FOREIGN KEY ("source_customer_music_id") REFERENCES "public"."customer_musics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "setlist_music_concert_position_idx" ON "setlist_music" ("concert_id","position");--> statement-breakpoint

-- Step 4: Backfill from setlist_items, keeping the old ids
INSERT INTO "setlist_music" (
  "id", "concert_id", "source_customer_music_id", "position", "note",
  "title", "artist", "lyrics", "chords", "original_key", "preferred_key", "studying",
  "genre", "genres", "spotify_link", "sheet_music_file", "created_at"
)
SELECT
  si."id", si."concert_id", cm."id", si."position", si."note",
  cm."title", cm."artist", cm."lyrics", cm."chords", cm."original_key", cm."preferred_key", cm."studying",
  cm."genre", cm."genres", cm."spotify_link", cm."sheet_music_file", si."created_at"
FROM "setlist_items" si
JOIN "customer_musics" cm ON cm."id" = si."music_id";--> statement-breakpoint

-- Step 5: Verify before anything is dropped (fails the migration on mismatch)
DO $$
BEGIN
  IF (SELECT count(*) FROM "setlist_items") <> (SELECT count(*) FROM "setlist_music") THEN
    RAISE EXCEPTION 'setlist row count mismatch';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "setlist_items" si
    LEFT JOIN "setlist_music" sm ON sm."id" = si."id"
    WHERE sm."id" IS NULL
  ) THEN
    RAISE EXCEPTION 'unmapped setlist rows';
  END IF;
END $$;--> statement-breakpoint

-- Step 6: Remove the catalog link from customer_musics
CREATE UNIQUE INDEX "customer_musics_customer_title_artist_unique"
  ON "customer_musics" ("customer_id", lower("title"), lower("artist"));--> statement-breakpoint
ALTER TABLE "customer_musics" DROP CONSTRAINT IF EXISTS "customer_musics_customer_catalog_unique";--> statement-breakpoint
ALTER TABLE "customer_musics" DROP CONSTRAINT IF EXISTS "customer_musics_music_catalog_id_music_catalog_id_fk";--> statement-breakpoint
ALTER TABLE "customer_musics" DROP COLUMN "music_catalog_id";--> statement-breakpoint
DROP TABLE "music_catalog";--> statement-breakpoint

-- Step 7: Drop the old join table
DROP TABLE "setlist_items";
