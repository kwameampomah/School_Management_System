import { defineConfig } from "drizzle-kit";

// ─── Database Mode Selection ──────────────────────────────────────────────────
// Mirrors the logic in lib/db/src/index.ts so that `drizzle-kit push`
// targets the correct database based on DB_MODE in your .env file.
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
  if (!url) throw new Error("DATABASE_URL is not set. Ensure the database is provisioned.");
  return url;
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: resolveConnectionString(),
  },
});
