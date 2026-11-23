-- 0013: flag marking a song of a concert's setlist as concluded by the user
-- NOT YET REGISTERED in drizzle/meta/_journal.json (applied by hand, like 0012).
ALTER TABLE "setlist_music" ADD COLUMN "is_concluded" boolean DEFAULT false NOT NULL;
