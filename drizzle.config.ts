import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit reads .env by default; we use Next.js convention .env.local.
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  casing: "snake_case",
  strict: true,
  verbose: true,
});
