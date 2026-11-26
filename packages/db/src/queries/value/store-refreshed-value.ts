import { envelopeSchema } from "@repo/contracts/api/envelope";
import type { EndpointId } from "@repo/core/ids/id";
import { err, ok, type Result } from "@repo/core/result";
import { sql } from "drizzle-orm";
import type { Database } from "../../client/database";
import { valuesLatest } from "../../schema/values-latest-table";
import type { StoredValue } from "./read-latest-value";

/**
 * Stores the value a successful refresh produced, replacing the previous one and clearing the
 * failure count. The value is parsed with the envelope's `data` schema first.
 */
export async function storeRefreshedValue(
  db: Database,
  refresh: {
    readonly endpoint_id: EndpointId;
    /** `data` is parsed before it is written, so it may come from anywhere. */
    readonly value: Omit<StoredValue, "data"> & { readonly data: unknown };
  },
): Promise<Result<void, { readonly code: "invalid_value" }>> {
  const data = envelopeSchema.shape.data.safeParse(refresh.value.data);
  if (!data.success) {
    return err({ code: "invalid_value" });
  }
  const row = { ...refresh.value, data: data.data, consecutive_failures: 0, last_error: null };
  await db
    .insert(valuesLatest)
    .values({ endpoint_id: refresh.endpoint_id, ...row })
    .onConflictDoUpdate({
      target: valuesLatest.endpoint_id,
      set: { ...row, updated_at: sql`now()` },
    });
  return ok(undefined);
}
