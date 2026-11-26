import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { MIGRATIONS_FOLDER } from "../client/in-process-database";

/** Migrates an empty in-process database and returns an image of its files to copy from. */
export async function buildMigratedImage(): Promise<Blob> {
  const template = await PGlite.create();
  await migrate(drizzle(template), { migrationsFolder: MIGRATIONS_FOLDER });
  const image = await template.dumpDataDir("none");
  await template.close();
  return image;
}
