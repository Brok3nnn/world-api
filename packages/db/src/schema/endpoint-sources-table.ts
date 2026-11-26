import { index, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import { endpoints } from "./endpoints-table";
import { sources } from "./sources-table";

/** Which sources an endpoint uses. A source that an endpoint uses cannot be removed. */
export const endpointSources = pgTable(
  "endpoint_sources",
  {
    endpoint_id: text("endpoint_id")
      .notNull()
      .references(() => endpoints.id, { onDelete: "cascade" }),
    source_id: text("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "restrict" }),
  },
  (table) => [
    primaryKey({ columns: [table.endpoint_id, table.source_id] }),
    index("endpoint_sources_source_idx").on(table.source_id),
  ],
).enableRLS();
