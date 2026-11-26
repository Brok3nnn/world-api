import { errorCodeSchema } from "@repo/contracts/api/error";
import { shapeSchema } from "@repo/contracts/api/shape";
import { sql } from "drizzle-orm";
import { boolean, check, index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { accounts } from "./accounts-table";
import { endpoints } from "./endpoints-table";
import { enumValues } from "./enum-values";
import { oneOf } from "./one-of";

/** How a call ended: `served` with a value, or the error code it was answered with. */
const USAGE_OUTCOMES = ["served", ...enumValues(errorCodeSchema)] as const;

/** One call of an endpoint. Rows are only ever added; statistics are derived from them. */
export const usageEvents = pgTable(
  "usage_events",
  {
    id: text("id").primaryKey(),
    endpoint_id: text("endpoint_id")
      .notNull()
      .references(() => endpoints.id, { onDelete: "restrict" }),
    /** The account that called, or nothing for an anonymous call. */
    caller_id: text("caller_id").references(() => accounts.id, { onDelete: "restrict" }),
    outcome: text("outcome", { enum: USAGE_OUTCOMES }).notNull(),
    shape: text("shape", { enum: enumValues(shapeSchema) }).notNull(),
    price_credits: integer("price_credits").notNull(),
    latency_ms: integer("latency_ms").notNull(),
    /** Whether the call ran the recipe instead of reading a stored value. */
    refreshed: boolean("refreshed").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("usage_events_caller_idx").on(table.caller_id),
    index("usage_events_endpoint_created_idx").on(table.endpoint_id, table.created_at),
    check("usage_events_id_prefix", sql`${table.id} ~ '^use_[0-9a-z_]{1,64}$'`),
    check("usage_events_outcome", oneOf(table.outcome, USAGE_OUTCOMES)),
    check("usage_events_shape", oneOf(table.shape, enumValues(shapeSchema))),
    check("usage_events_price_credits", sql`${table.price_credits} >= 0`),
    check("usage_events_latency_ms", sql`${table.latency_ms} >= 0`),
  ],
).enableRLS();
