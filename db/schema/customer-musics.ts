import { boolean, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { musicalKeyEnum, musicGenreEnum } from "./enums";
import { customers } from "./customers";

export const customerMusics = pgTable(
  "customer_musics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    artist: text("artist").notNull(),
    lyrics: text("lyrics"),
    chords: text("chords"),
    // Personal performance settings
    originalKey: musicalKeyEnum("original_key"),
    preferredKey: musicalKeyEnum("preferred_key"),
    studying: boolean("studying").notNull().default(false),
    genre: musicGenreEnum("genre"),
    genres: text("genres").array(),
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
    // One library entry per customer and song, case-insensitive
    uniqueIndex("customer_musics_customer_title_artist_unique").on(
      table.customerId,
      sql`lower(${table.title})`,
      sql`lower(${table.artist})`
    ),
  ]
);
