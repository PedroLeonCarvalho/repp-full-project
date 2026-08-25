import { boolean, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { concerts } from "./concerts";
import { customers } from "./customers";
import { contractors } from "./contractors";

export const contracts = pgTable("contracts", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  concertId: uuid("concert_id")
    .notNull()
    .unique()
    .references(() => concerts.id, { onDelete: "cascade" }),
  contractorId: uuid("contractor_id").references(() => contractors.id, {
    onDelete: "set null",
  }),
  mealsIncluded: boolean("meals_included").notNull().default(false),
  maximumConsumptionAmount: numeric("maximum_consumption_amount", {
    precision: 10,
    scale: 2,
  }),
  agreedFee: numeric("agreed_fee", { precision: 10, scale: 2 }),
  contractText: text("contract_text").notNull(),
  status: text("status").notNull().default("DRAFT"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
