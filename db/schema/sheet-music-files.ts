import { customType, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { customers } from "./customers";

// Postgres bytea. The Neon HTTP driver may return bytea as a "\x..." hex string
// or as a Buffer depending on the code path, so both are handled.
const bytea = customType<{ data: Buffer; driverData: string }>({
  dataType() {
    return "bytea";
  },
  toDriver(value: Buffer) {
    return `\\x${value.toString("hex")}`;
  },
  fromDriver(value: unknown) {
    if (typeof value === "string") {
      return Buffer.from(value.replace(/^\\x/, ""), "hex");
    }
    return Buffer.from(value as Uint8Array);
  },
});

/**
 * PDF bytes of a sheet music file. Shared by customer_musics (library) and
 * setlist_music (copy-on-add), so a setlist copy keeps the same file row.
 * Immutable: replacing a PDF creates a new row with a new id.
 */
export const sheetMusicFiles = pgTable(
  "sheet_music_files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    fileName: text("file_name").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    sha256: text("sha256").notNull(),
    content: bytea("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("sheet_music_files_created_at_idx").on(table.createdAt)]
);
