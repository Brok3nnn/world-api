import { buildEventSchema } from "@repo/contracts/build/build-event";
import { buildStageSchema } from "@repo/contracts/build/build-stage";
import { sql } from "drizzle-orm";
import { check, index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { builds } from "./builds-table";
import { enumValues } from "./enum-values";
import { oneOf } from "./one-of";

const KINDS = enumValues(buildEventSchema.shape.kind);

/** One step of a build's story, shown to the requester as progress. Rows are only added. */
export const buildEvents = pgTable(
  "build_events",
  {
    id: text("id").primaryKey(),
    build_id: text("build_id")
      .notNull()
      .references(() => builds.id, { onDelete: "cascade" }),
    stage: text("stage", { enum: enumValues(buildStageSchema) }).notNull(),
    kind: text("kind", { enum: KINDS }).notNull(),
    message: text("message").notNull(),
    /** Small structured facts, never source content or values. */
    detail: jsonb("detail").$type<Record<string, unknown>>(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("build_events_build_created_idx").on(table.build_id, table.created_at),
    check("build_events_id_prefix", sql`${table.id} ~ '^bev_[0-9a-z_]{1,64}$'`),
    check("build_events_stage", oneOf(table.stage, enumValues(buildStageSchema))),
    check("build_events_kind", oneOf(table.kind, KINDS)),
    check("build_events_message_length", sql`length(${table.message}) between 1 and 300`),
  ],
).enableRLS();
