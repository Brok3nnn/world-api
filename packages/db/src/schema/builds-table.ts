import type { BuildRequest } from "@repo/contracts/build/build-request";
import { buildStageSchema } from "@repo/contracts/build/build-stage";
import { buildStatusSchema } from "@repo/contracts/build/build-status";
import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { accounts } from "./accounts-table";
import { endpoints } from "./endpoints-table";
import { enumValues } from "./enum-values";
import { oneOf } from "./one-of";

/** One run of the builder for one request. This table is also the queue of builds to run. */
export const builds = pgTable(
  "builds",
  {
    id: text("id").primaryKey(),
    requester_id: text("requester_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    /** Parsed with `buildRequestSchema` on every read and write. */
    request: jsonb("request").$type<BuildRequest>().notNull(),
    status: text("status", { enum: enumValues(buildStatusSchema) })
      .notNull()
      .default("queued"),
    stage: text("stage", { enum: enumValues(buildStageSchema) }),
    progress: doublePrecision("progress").notNull().default(0),
    /** Drafts made so far; the builder stops after three. */
    attempt: integer("attempt").notNull().default(0),
    endpoint_id: text("endpoint_id").references(() => endpoints.id, { onDelete: "restrict" }),
    /** One sentence for the requester when the build failed or was rejected. */
    reason: text("reason"),
    /** A runner holds the build until then; afterwards another runner may claim it. */
    locked_until: timestamp("locked_until", { withTimezone: true }),
    cost_micro_usd: bigint("cost_micro_usd", { mode: "number" }).notNull().default(0),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("builds_claim_idx").on(table.status, table.locked_until),
    index("builds_requester_idx").on(table.requester_id),
    index("builds_endpoint_idx").on(table.endpoint_id),
    check("builds_id_prefix", sql`${table.id} ~ '^bld_[0-9a-z_]{1,64}$'`),
    check("builds_status", oneOf(table.status, enumValues(buildStatusSchema))),
    check("builds_stage", oneOf(table.stage, enumValues(buildStageSchema))),
    check("builds_progress", sql`${table.progress} between 0 and 1`),
    check("builds_attempt", sql`${table.attempt} >= 0`),
    check("builds_cost", sql`${table.cost_micro_usd} >= 0`),
    check(
      "builds_outcome",
      sql`(${table.status} <> 'succeeded' or ${table.endpoint_id} is not null) and (${table.status} not in ('failed', 'rejected') or ${table.reason} is not null)`,
    ),
  ],
).enableRLS();
