import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  console.log("Starting migration process...");

  try {
    // 1. Create music_catalog table
    console.log("Step 1: Creating music_catalog table...");
    await sql`
      CREATE TABLE IF NOT EXISTS "music_catalog" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "title" text NOT NULL,
        "artist" text NOT NULL,
        "lyrics" text,
        "chords" text,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "music_catalog_title_artist_unique" UNIQUE("title","artist")
      );
    `;

    // 2. Populate music_catalog
    console.log("Step 2: Populating music_catalog from musics...");
    const catalogRes = await sql`
      INSERT INTO "music_catalog" ("title", "artist", "lyrics")
      SELECT DISTINCT ON (lower(title), lower(artist)) title, artist, lyrics
      FROM "musics"
      ORDER BY lower(title), lower(artist), created_at ASC
      ON CONFLICT ("title", "artist") DO NOTHING
      RETURNING id;
    `;
    const catalogCount = await sql`SELECT count(*) FROM music_catalog`;
    console.log(`music_catalog now has ${catalogCount[0].count} entries.`);

    // 3. Add music_catalog_id column to musics
    console.log("Step 3: Adding music_catalog_id column to musics...");
    await sql`ALTER TABLE "musics" ADD COLUMN IF NOT EXISTS "music_catalog_id" uuid;`;

    // 4. Populate music_catalog_id in musics
    console.log("Step 4: Populating music_catalog_id in musics...");
    await sql`
      UPDATE "musics" m
      SET "music_catalog_id" = mc."id"
      FROM "music_catalog" mc
      WHERE lower(m."title") = lower(mc."title")
        AND lower(m."artist") = lower(mc."artist");
    `;
    const nullFkCount = await sql`SELECT count(*) FROM musics WHERE music_catalog_id IS NULL`;
    console.log(`Musics with NULL music_catalog_id: ${nullFkCount[0].count}`);
    if (parseInt(nullFkCount[0].count) > 0) {
      throw new Error("Found musics with NULL music_catalog_id! Aborting migration.");
    }

    // 5. Add chords column
    console.log("Step 5: Adding chords column to musics...");
    await sql`ALTER TABLE "musics" ADD COLUMN IF NOT EXISTS "chords" text;`;

    // 6. Set NOT NULL on music_catalog_id
    console.log("Step 6: Setting music_catalog_id NOT NULL...");
    await sql`ALTER TABLE "musics" ALTER COLUMN "music_catalog_id" SET NOT NULL;`;

    // 7. Add FK constraint
    console.log("Step 7: Adding FK constraint...");
    await sql`
      ALTER TABLE "musics" 
      ADD CONSTRAINT "musics_music_catalog_id_music_catalog_id_fk" 
      FOREIGN KEY ("music_catalog_id") REFERENCES "public"."music_catalog"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    `;

    // 8. Drop title and artist columns
    console.log("Step 8: Dropping title and artist columns from musics...");
    await sql`ALTER TABLE "musics" DROP COLUMN IF EXISTS "title";`;
    await sql`ALTER TABLE "musics" DROP COLUMN IF EXISTS "artist";`;

    // 9. Drop old unique constraint and add new unique constraint
    console.log("Step 9: Updating unique constraints...");
    await sql`ALTER TABLE "musics" DROP CONSTRAINT IF EXISTS "musics_customer_title_artist_unique";`;
    await sql`ALTER TABLE "musics" DROP CONSTRAINT IF EXISTS "musics_customer_catalog_unique";`;
    await sql`
      ALTER TABLE "musics" 
      ADD CONSTRAINT "musics_customer_catalog_unique" 
      UNIQUE("customer_id","music_catalog_id");
    `;

    // 10. Rename table musics -> customer_musics
    console.log("Step 10: Renaming musics table to customer_musics...");
    await sql`ALTER TABLE "musics" RENAME TO "customer_musics";`;

    // 11. Rename constraints
    console.log("Step 11: Renaming constraints...");
    await sql`ALTER TABLE "customer_musics" RENAME CONSTRAINT "musics_customer_id_customers_id_fk" TO "customer_musics_customer_id_customers_id_fk";`;
    await sql`ALTER TABLE "customer_musics" RENAME CONSTRAINT "musics_music_catalog_id_music_catalog_id_fk" TO "customer_musics_music_catalog_id_music_catalog_id_fk";`;
    await sql`ALTER TABLE "customer_musics" RENAME CONSTRAINT "musics_customer_catalog_unique" TO "customer_musics_customer_catalog_unique";`;

    console.log("SUCCESS! Migration completed cleanly.");

    // Final verification
    const finalCatalog = await sql`SELECT count(*) FROM music_catalog`;
    const finalCustomerMusics = await sql`SELECT count(*) FROM customer_musics`;
    console.log(`Verification: music_catalog count = ${finalCatalog[0].count}, customer_musics count = ${finalCustomerMusics[0].count}`);

  } catch (err) {
    console.error("Migration failed:", err);
  }
}

runMigration();
