import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
const globalDb = globalThis as unknown as { portalPool?: Pool };
export const pool = globalDb.portalPool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: 6 });
if (process.env.NODE_ENV !== "production") globalDb.portalPool = pool;
export const db = drizzle(pool, { schema });

