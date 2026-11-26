import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { inject } from "vitest";
import type { Database } from "../client/database";
import { buildMigratedImage } from "./migrated-image";

declare module "vitest" {
  export interface ProvidedContext {
    /** Path of the migrated database image written by `global-setup`, when it is configured. */
    migratedDatabaseImage?: string;
  }
}

/** One row of a query result, keyed by column name. */
type Row = Readonly<Record<string, unknown>>;

/** A private Postgres that lives in memory for the duration of one test. */
export interface TestDatabase {
  /** The typed database, with every migration applied. */
  readonly db: Database;
  /** Runs one statement with bound parameters and returns its rows, for assertions. */
  query(sql: string, parameters?: readonly unknown[]): Promise<readonly Row[]>;
  /** Releases the database; it cannot be used afterwards. */
  close(): Promise<void>;
}

let migratedImage: Promise<Blob> | undefined;

/** The image written once for the whole run, or one migrated here when there is none. */
async function loadMigratedImage(): Promise<Blob> {
  const path = inject("migratedDatabaseImage");
  return path === undefined ? buildMigratedImage() : new Blob([await readFile(path)]);
}

/**
 * Creates a fresh Postgres in this process for an integration test, with every migration
 * applied. Each call returns a database of its own, so tests never see each other's rows and
 * need no service or account. It copies a migrated image instead of migrating again.
 */
export async function createTestDatabase(): Promise<TestDatabase> {
  migratedImage ??= loadMigratedImage();
  const client = await PGlite.create({ loadDataDir: await migratedImage });
  return {
    db: drizzle(client),
    async query(sql, parameters = []) {
      const result = await client.query<Row>(sql, [...parameters]);
      return result.rows;
    },
    close: () => client.close(),
  };
}
