import type { EndpointId } from "@repo/core/ids/id";
import { sql } from "drizzle-orm";
import type { Database } from "../../client/database";
import { valuesLatest } from "../../schema/values-latest-table";

/**
 * Counts a failed refresh, keeping any stored value so it can be served within its grace
 * period. Returns the failures in a row, including this one.
 */
export async function recordRefreshFailure(
  db: Database,
  failure: { readonly endpoint_id: EndpointId; readonly error: string },
): Promise<number> {
  const [row] = await db
    .insert(valuesLatest)
    .values({
      endpoint_id: failure.endpoint_id,
      consecutive_failures: 1,
      last_error: failure.error,
    })
    .onConflictDoUpdate({
      target: valuesLatest.endpoint_id,
      set: {
        consecutive_failures: sql`${valuesLatest.consecutive_failures} + 1`,
        last_error: failure.error,
        updated_at: sql`now()`,
      },
    })
    .returning({ consecutive_failures: valuesLatest.consecutive_failures });
  if (row === undefined) {
    throw new Error("The database returned no row for an upsert.");
  }
  return row.consecutive_failures;
}
