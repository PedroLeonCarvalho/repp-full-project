import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function run() {
  console.log("Adding genres array column to customer_musics...");
  await sql`ALTER TABLE "customer_musics" ADD COLUMN IF NOT EXISTS "genres" text[];`;
  console.log("Populating genres from existing genre column...");
  await sql`
    UPDATE "customer_musics"
    SET "genres" = ARRAY["genre"::text]
    WHERE "genre" IS NOT NULL AND ("genres" IS NULL OR cardinality("genres") = 0);
  `;
  console.log("Migration completed successfully!");
}

run().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
