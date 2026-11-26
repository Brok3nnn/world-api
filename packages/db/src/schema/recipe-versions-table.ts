import type { TestReport } from "@repo/contracts/build/test-report";
import type { Recipe } from "@repo/contracts/recipe/recipe-schema";
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { builds } from "./builds-table";
import { endpoints } from "./endpoints-table";

/**
 * One recipe of an endpoint. The document and its test report never change; fixing a recipe
 * adds the next version. Exactly the version marked `active` serves calls.
 */
export const recipeVersions = pgTable(
  "recipe_versions",
  {
    id: text("id").primaryKey(),
    endpoint_id: text("endpoint_id")
      .notNull()
      .references(() => endpoints.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    /** Parsed with `recipeSchema` on every read and write. */
    document: jsonb("document").$type<Recipe>().notNull(),
    /** The evidence that justified this version; absent for a recipe written by hand. */
    test_report: jsonb("test_report").$type<TestReport>(),
    active: boolean("active").notNull().default(false),
    /** The build that wrote this version; absent for a recipe written by hand. */
    created_by_build_id: text("created_by_build_id").references(() => builds.id, {
      onDelete: "restrict",
    }),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("recipe_versions_endpoint_version_unique").on(table.endpoint_id, table.version),
    uniqueIndex("recipe_versions_one_active_idx").on(table.endpoint_id).where(sql`${table.active}`),
    index("recipe_versions_build_idx").on(table.created_by_build_id),
    check("recipe_versions_id_prefix", sql`${table.id} ~ '^rv_[0-9a-z_]{1,64}$'`),
    check("recipe_versions_version", sql`${table.version} >= 1`),
  ],
).enableRLS();
