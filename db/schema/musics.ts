import { boolean, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { musicalKeyEnum, musicGenreEnum } from "./enums";

export const musics = pgTable(
  "musics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: text("customer_id").notNull(),
    title: text("title").notNull(),
    artist: text("artist").notNull(),
    lyrics: text("lyrics"),
    originalKey: musicalKeyEnum("original_key"),
    preferredKey: musicalKeyEnum("preferred_key"),
    skillLevel: boolean("skill_level").notNull().default(true),
    genre: musicGenreEnum("genre"),
    note: text("note"),
    spotifyLink: text("spotify_link"),
    sheetMusicFile: text("sheet_music_file"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique("musics_customer_title_artist_unique").on(
      table.customerId,
      table.title,
      table.artist
    ),
  ]
);
