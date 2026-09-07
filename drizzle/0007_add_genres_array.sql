ALTER TABLE "customer_musics" ADD COLUMN IF NOT EXISTS "genres" text[];--> statement-breakpoint
UPDATE "customer_musics"
SET "genres" = ARRAY["genre"::text]
WHERE "genre" IS NOT NULL AND ("genres" IS NULL OR cardinality("genres") = 0);
