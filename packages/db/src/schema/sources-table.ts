import type { SourceCapabilities } from "@repo/contracts/source/source-capabilities";
import { sourceTierSchema } from "@repo/contracts/source/source-tier";
import { sql } from "drizzle-orm";
import { check, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { enumValues } from "./enum-values";
import { oneOf } from "./one-of";

/** An approved origin of data. A recipe may only fetch the hosts of its endpoint's sources. */
export const sources = pgTable(
  "sources",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
    hosts: text("hosts").array().notNull(),
    docs_url: text("docs_url").notNull(),
    licence: text("licence").notNull(),
    /** `null` when the licence requires no attribution. */
    attribution: text("attribution"),
    /** The conditions read in the source's terms; kept for review, never served. */
    terms: text("terms").notNull(),
    evidence_url: text("evidence_url").notNull(),
    tier: text("tier", { enum: enumValues(sourceTierSchema) }).notNull(),
    policy_checked_at: timestamp("policy_checked_at", { withTimezone: true }).notNull(),
    /** Parsed with `sourceCapabilitiesSchema` on every read and write. */
    capabilities: jsonb("capabilities").$type<SourceCapabilities>().notNull(),
    rate_limit_per_min: integer("rate_limit_per_min").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("sources_id_prefix", sql`${table.id} ~ '^src_[0-9a-z_]{1,64}$'`),
    check("sources_hosts", sql`cardinality(${table.hosts}) between 1 and 10`),
    check(
      "sources_https",
      sql`${table.docs_url} ~ '^https://' and ${table.evidence_url} ~ '^https://'`,
    ),
    check("sources_tier", oneOf(table.tier, enumValues(sourceTierSchema))),
    check("sources_rate_limit", sql`${table.rate_limit_per_min} > 0`),
  ],
).enableRLS();
