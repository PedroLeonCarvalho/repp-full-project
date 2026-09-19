ALTER TABLE "music_catalog" ADD COLUMN IF NOT EXISTS "is_custom" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'music_catalog' AND column_name = 'lyrics'
  ) THEN
    ALTER TABLE "music_catalog" RENAME COLUMN "lyrics" TO "canonical_lyrics";
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'music_catalog' AND column_name = 'chords'
  ) THEN
    ALTER TABLE "music_catalog" RENAME COLUMN "chords" TO "canonical_chords";
  END IF;
END $$;
