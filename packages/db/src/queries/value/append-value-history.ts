import { envelopeSchema } from "@repo/contracts/api/envelope";
import type { EndpointId, RecipeVersionId, ValueId } from "@repo/core/ids/id";
import { err, ok, type Result } from "@repo/core/result";
import type { Database } from "../../client/database";
import { valuesHistory } from "../../schema/values-history-table";

/** Adds a past value of an endpoint to its history. History rows are never changed. */
export async function appendValueHistory(
  db: Database,
  entry: {
    readonly id: ValueId;
    readonly endpoint_id: EndpointId;
    /** Parsed with the envelope's `data` schema before it is written. */
    readonly data: unknown;
    readonly as_of: Date;
    readonly recipe_version_id: RecipeVersionId;
  },
): Promise<Result<void, { readonly code: "invalid_value" }>> {
  const data = envelopeSchema.shape.data.safeParse(entry.data);
  if (!data.success) {
    return err({ code: "invalid_value" });
  }
  await db.insert(valuesHistory).values({ ...entry, data: data.data });
  return ok(undefined);
}
