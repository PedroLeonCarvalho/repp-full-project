import { integer, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { customers } from "./customers";
import { projects } from "./projects";
import { contractors } from "./contractors";
import { paymentStatusEnum } from "./enums";

export const concerts = pgTable("concerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  contractorId: uuid("contractor_id").references(() => contractors.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  location: text("location"),
  presentationDate: timestamp("presentation_date", { withTimezone: true })
    .notNull()
    .defaultNow(),
  startTime: text("start_time"),
  finishTime: text("finish_time"),
  durationInHours: numeric("duration_in_hours", { precision: 4, scale: 1 }),
  totalBreakTime: integer("total_break_time"),
  agreedFee: numeric("agreed_fee", { precision: 10, scale: 2 }),
  travelCost: numeric("travel_cost", { precision: 10, scale: 2 }),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("PENDING"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
