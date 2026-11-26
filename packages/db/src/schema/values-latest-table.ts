import type { Envelope } from "@repo/contracts/api/envelope";
import { sql } from "drizzle-orm";
import { check, index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { endpoints } from "./endpoints-table";
import { recipeVersions } from "./recipe-versions-table";

/**
 * The current value of an endpoint and the state of its refreshes. The row can exist before
 * any value does, to count failures; the value columns are then all empty together.
 */
export const valuesLatest = pgTable(
  "values_latest",
  {
    endpoint_id: text("endpoint_id")
      .primaryKey()
      .references(() => endpoints.id, { onDelete: "cascade" }),
    /** Parsed with the envelope's `data` schema and the endpoint's output spec. */
    data: jsonb("data").$type<Envelope["data"]>(),
    as_of: timestamp("as_of", { withTimezone: true }),
    fetched_at: timestamp("fetched_at", { withTimezone: true }),
    expires_at: timestamp("expires_at", { withTimezone: true }),
    recipe_version_id: text("recipe_version_id").references(() => recipeVersions.id, {
      onDelete: "no action",
    }),
    consecutive_failures: integer("consecutive_failures").notNull().default(0),
    last_error: text("last_error"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("values_latest_recipe_version_idx").on(table.recipe_version_id),
    check(
      "values_latest_value_complete",
      sql`num_nulls(${table.data}, ${table.as_of}, ${table.fetched_at}, ${table.expires_at}, ${table.recipe_version_id}) in (0, 5)`,
    ),
    check("values_latest_expiry", sql`${table.expires_at} > ${table.fetched_at}`),
    check("values_latest_failures", sql`${table.consecutive_failures} >= 0`),
  ],
).enableRLS();
