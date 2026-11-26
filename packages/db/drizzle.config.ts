import { defineConfig } from "drizzle-kit";

/** Where the migration generator reads the schema and writes migrations. */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/*-table.ts",
  out: "./migrations",
});
