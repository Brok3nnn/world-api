import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

/**
 * A connection to the system of record, whichever driver serves it. Every query function takes
 * one as its first argument; the caller that owns a unit of work decides which.
 */
export type Database = PgDatabase<PgQueryResultHKT>;
