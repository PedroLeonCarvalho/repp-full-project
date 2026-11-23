import { boolean, integer, pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { musicalKeyEnum, musicGenreEnum } from "./enums";
import { concerts } from "./concerts";
import { customerMusics } from "./customer-musics";

/**
 * A song as it exists inside one concert's setlist.
 * Created by copying a customer_musics row (copy-on-add), so edits to the
 * library do not change concerts that already include the song.
 */
export const setlistMusic = pgTable(
  "setlist_music",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    concertId: uuid("concert_id")
      .notNull()
      .references(() => concerts.id, { onDelete: "cascade" }),
    // Library song this row was copied from; kept for traceability only
    sourceCustomerMusicId: uuid("source_customer_music_id").references(
      () => customerMusics.id,
      { onDelete: "set null" }
    ),
    position: integer("position").notNull(),
    note: text("note"),
    // Same content as customer_musics
    title: text("title").notNull(),
    artist: text("artist").notNull(),
    lyrics: text("lyrics"),
    chords: text("chords"),
    originalKey: musicalKeyEnum("original_key"),
    preferredKey: musicalKeyEnum("preferred_key"),
    studying: boolean("studying").notNull().default(false),
    // Marked as "concluded" by the user for this concert only
    isConcluded: boolean("is_concluded").notNull().default(false),
    genre: musicGenreEnum("genre"),
    genres: text("genres").array(),
    spotifyLink: text("spotify_link"),
    sheetMusicFile: text("sheet_music_file"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("setlist_music_concert_position_idx").on(table.concertId, table.position)]
);
