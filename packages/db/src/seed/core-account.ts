import type { accounts } from "../schema/accounts-table";

/** The platform account that owns the catalog endpoints built from open data. */
export const CORE_ACCOUNT = {
  id: "acc_core",
  handle: "core",
  display_name: "Core catalog",
  kind: "platform",
} as const satisfies typeof accounts.$inferInsert;
