import { boolean, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { musicalKeyEnum, musicGenreEnum } from "./enums";
import { customers } from "./customers";
import { musicCatalog } from "./music-catalog";

export const customerMusics = pgTable(
  "customer_musics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    musicCatalogId: uuid("music_catalog_id")
      .notNull()
      .references(() => musicCatalog.id, { onDelete: "restrict" }),
    // Personal overrides (Option B) — take priority over catalog values when non-null
    lyrics: text("lyrics"),
    chords: text("chords"),
    // Personal performance settings
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
    unique("customer_musics_customer_catalog_unique").on(
      table.customerId,
      table.musicCatalogId
    ),
  ]
);
