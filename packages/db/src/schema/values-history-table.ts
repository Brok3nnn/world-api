import type { Envelope } from "@repo/contracts/api/envelope";
import { sql } from "drizzle-orm";
import { check, index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { endpoints } from "./endpoints-table";
import { recipeVersions } from "./recipe-versions-table";

/** Every past value of an endpoint. Rows are only ever added, never changed. */
export const valuesHistory = pgTable(
  "values_history",
  {
    id: text("id").primaryKey(),
    endpoint_id: text("endpoint_id")
      .notNull()
      .references(() => endpoints.id, { onDelete: "cascade" }),
    data: jsonb("data").$type<Envelope["data"]>().notNull(),
    as_of: timestamp("as_of", { withTimezone: true }).notNull(),
    recipe_version_id: text("recipe_version_id")
      .notNull()
      .references(() => recipeVersions.id, { onDelete: "no action" }),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("values_history_recipe_version_idx").on(table.recipe_version_id),
    index("values_history_endpoint_as_of_idx").on(table.endpoint_id, table.as_of),
    check("values_history_id_prefix", sql`${table.id} ~ '^val_[0-9a-z_]{1,64}$'`),
  ],
).enableRLS();
