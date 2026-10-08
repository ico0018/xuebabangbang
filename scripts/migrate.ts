import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
async function main() { const pool = new Pool({ connectionString: process.env.DATABASE_URL }); try { await migrate(drizzle(pool), { migrationsFolder: "./drizzle" }); console.log("Database migrations completed."); } finally { await pool.end(); } }
main().catch((e) => { console.error(e); process.exitCode = 1; });

