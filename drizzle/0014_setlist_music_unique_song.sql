-- 0014: one song per concert, identified by normalized title + artist.
-- NOT YET REGISTERED in drizzle/meta/_journal.json and NOT YET APPLIED (same convention as 0012/0013).
-- Apply only AFTER the existing duplicate rows are removed; otherwise this index creation fails.
-- The expression must match features/concert/utils/song-key.ts (trim, collapse spaces, lowercase).

CREATE UNIQUE INDEX IF NOT EXISTS "setlist_music_concert_song_unique"
  ON "setlist_music" (
    "concert_id",
    lower(regexp_replace(btrim("title"), '\s+', ' ', 'g')),
    lower(regexp_replace(btrim("artist"), '\s+', ' ', 'g'))
  );
