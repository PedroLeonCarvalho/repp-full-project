import { boolean, pgTable, text, timestamp, uuid, unique } from "drizzle-orm/pg-core";

export const musicCatalog = pgTable(
  "music_catalog",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    artist: text("artist").notNull(),
    canonicalLyrics: text("canonical_lyrics"),
    canonicalChords: text("canonical_chords"),
    isCustom: boolean("is_custom").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique("music_catalog_title_artist_unique").on(table.title, table.artist),
  ]
);

