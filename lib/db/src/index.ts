import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// ─── Database Mode Selection ──────────────────────────────────────────────────
//
// DB_MODE=cloud  → connects to Neon cloud database (CLOUD_DATABASE_URL)
// DB_MODE=local  → connects to local PostgreSQL    (LOCAL_DATABASE_URL)
// (unset)        → falls back to DATABASE_URL for backward compatibility
//
// To switch databases, change DB_MODE in your .env file.
// ─────────────────────────────────────────────────────────────────────────────

function resolveConnectionString(): string {
  const mode = process.env.DB_MODE;

  if (mode === "cloud") {
    const url = process.env.CLOUD_DATABASE_URL;
    if (!url) throw new Error("DB_MODE=cloud but CLOUD_DATABASE_URL is not set.");
    return url;
  }

  if (mode === "local") {
    const url = process.env.LOCAL_DATABASE_URL;
    if (!url) throw new Error("DB_MODE=local but LOCAL_DATABASE_URL is not set.");
    return url;
  }

  // Legacy fallback
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database? " +
      "Or set DB_MODE=cloud / DB_MODE=local with the corresponding URL."
    );
  }
  return url;
}

const connectionString = resolveConnectionString();

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });

export * from "./schema";
