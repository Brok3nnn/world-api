import { methodSchema } from "@repo/contracts/api/method";
import { categorySchema } from "@repo/contracts/endpoint/category";
import { endpointStatusSchema } from "@repo/contracts/endpoint/endpoint-status";
import { freshnessSchema } from "@repo/contracts/endpoint/freshness";
import type { OutputSpec } from "@repo/contracts/endpoint/output-spec";
import { visibilitySchema } from "@repo/contracts/endpoint/visibility";
import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { accounts } from "./accounts-table";
import { enumValues } from "./enum-values";
import { oneOf } from "./one-of";

/** One addressable API, `GET /@owner/slug`. Its recipes are in `recipe_versions`. */
export const endpoints = pgTable(
  "endpoints",
  {
    id: text("id").primaryKey(),
    owner_id: text("owner_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    category: text("category", { enum: enumValues(categorySchema) }).notNull(),
    visibility: text("visibility", { enum: enumValues(visibilitySchema) }).notNull(),
    status: text("status", { enum: enumValues(endpointStatusSchema) }).notNull(),
    method: text("method", { enum: enumValues(methodSchema) }).notNull(),
    freshness: text("freshness", { enum: enumValues(freshnessSchema) }).notNull(),
    price_credits: integer("price_credits").notNull(),
    /** Parsed with `outputSpecSchema` on every read and write. */
    output_spec: jsonb("output_spec").$type<OutputSpec>().notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("endpoints_owner_slug_unique").on(table.owner_id, table.slug),
    index("endpoints_catalog_idx").on(table.visibility, table.status, table.created_at),
    index("endpoints_search_idx").using(
      "gin",
      sql`to_tsvector('simple', ${table.title} || ' ' || ${table.summary} || ' ' || ${table.category})`,
    ),
    check("endpoints_id_prefix", sql`${table.id} ~ '^ep_[0-9a-z_]{1,64}$'`),
    check(
      "endpoints_slug_format",
      sql`${table.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(${table.slug}) <= 64`,
    ),
    check("endpoints_title_length", sql`length(${table.title}) between 1 and 80`),
    check("endpoints_summary_length", sql`length(${table.summary}) between 1 and 280`),
    check("endpoints_category", oneOf(table.category, categorySchema.options)),
    check("endpoints_visibility", oneOf(table.visibility, visibilitySchema.options)),
    check("endpoints_status", oneOf(table.status, endpointStatusSchema.options)),
    check("endpoints_method", oneOf(table.method, methodSchema.options)),
    check("endpoints_freshness", oneOf(table.freshness, freshnessSchema.options)),
    check("endpoints_price_credits", sql`${table.price_credits} >= 0`),
  ],
).enableRLS();
