import { type Envelope, envelopeSchema } from "@repo/contracts/api/envelope";
import type { EndpointId, RecipeVersionId } from "@repo/core/ids/id";
import { eq } from "drizzle-orm";
import type { Database } from "../../client/database";
import { valuesLatest } from "../../schema/values-latest-table";
import { parseStored } from "../parse-stored";
import { storedId } from "../stored-id";

/** A stored value and when it stops being fresh. */
export interface StoredValue {
  readonly data: Envelope["data"];
  readonly as_of: Date;
  readonly fetched_at: Date;
  readonly expires_at: Date;
  readonly recipe_version_id: RecipeVersionId;
}

/** The refresh state of an endpoint: its value, if it has one, and its failures in a row. */
export interface LatestValue {
  readonly value: StoredValue | null;
  readonly consecutive_failures: number;
  readonly last_error: string | null;
}

/** The latest value of an endpoint, or `undefined` when it was never refreshed. */
export async function readLatestValue(
  db: Database,
  endpointId: EndpointId,
): Promise<LatestValue | undefined> {
  const [row] = await db
    .select()
    .from(valuesLatest)
    .where(eq(valuesLatest.endpoint_id, endpointId));
  if (row === undefined) {
    return undefined;
  }
  const { data, as_of, fetched_at, expires_at, recipe_version_id } = row;
  const complete =
    data !== null &&
    as_of !== null &&
    fetched_at !== null &&
    expires_at !== null &&
    recipe_version_id !== null;
  return {
    value: complete
      ? {
          data: parseStored(envelopeSchema.shape.data, data, "value"),
          as_of,
          fetched_at,
          expires_at,
          recipe_version_id: storedId("recipeVersion", recipe_version_id),
        }
      : null,
    consecutive_failures: row.consecutive_failures,
    last_error: row.last_error,
  };
}
