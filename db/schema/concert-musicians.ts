import { numeric, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { concerts } from "./concerts";
import { accompanyingMusicians } from "./accompanying-musicians";

export const concertMusicians = pgTable("concert_musicians", {
  id: uuid("id").primaryKey().defaultRandom(),
  concertId: uuid("concert_id")
    .notNull()
    .references(() => concerts.id, { onDelete: "cascade" }),
  musicianId: uuid("musician_id")
    .notNull()
    .references(() => accompanyingMusicians.id, { onDelete: "cascade" }),
  agreedFee: numeric("agreed_fee", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
