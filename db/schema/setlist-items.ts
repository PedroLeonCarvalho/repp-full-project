import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { concerts } from "./concerts";
import { customerMusics } from "./customer-musics";

export const setlistItems = pgTable("setlist_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  concertId: uuid("concert_id")
    .notNull()
    .references(() => concerts.id, { onDelete: "cascade" }),
  musicId: uuid("music_id")
    .notNull()
    .references(() => customerMusics.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
