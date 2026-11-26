import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { Database } from "./database";

/** The folder of every migration, applied in the order of their names. */
export const MIGRATIONS_FOLDER = fileURLToPath(new URL("../../migrations", import.meta.url));

/** A Postgres in this process; its rows are gone once it is closed. */
export interface InProcessDatabase {
  readonly db: Database;
  close(): Promise<void>;
}

/**
 * Opens a Postgres in this process with every migration applied, for a command that needs the
 * real database for one run, such as a proof, without a service or an account.
 */
export async function openInProcessDatabase(): Promise<InProcessDatabase> {
  const client = await PGlite.create();
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  return { db, close: () => client.close() };
}
