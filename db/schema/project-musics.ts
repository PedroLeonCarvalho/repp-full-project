import { pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { musics } from "./musics";

export const projectMusics = pgTable(
  "project_musics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: text("project_id").notNull(),
    musicId: uuid("music_id")
      .notNull()
      .references(() => musics.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("project_musics_project_music_unique").on(
      table.projectId,
      table.musicId
    ),
  ]
);
