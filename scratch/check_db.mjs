import { neon } from "@neondatabase/serverless";


const sql = neon(process.env.DATABASE_URL);

async function checkDb() {
  try {
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log("Tables in DB:", tables.map(t => t.table_name));

    const musicsCols = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'musics'
    `;
    console.log("Musics columns:", musicsCols.map(c => c.column_name));

    const count = await sql`SELECT count(*) FROM musics`;
    console.log("Musics row count:", count[0].count);
  } catch (err) {
    console.error("Error checking DB:", err);
  }
}

checkDb();
