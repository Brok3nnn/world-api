import type { Database } from "@repo/db/client/database";
import { appendValueHistory } from "@repo/db/queries/value/append-value-history";
import { readLatestValue } from "@repo/db/queries/value/read-latest-value";
import { recordRefreshFailure } from "@repo/db/queries/value/record-refresh-failure";
import { storeRefreshedValue } from "@repo/db/queries/value/store-refreshed-value";
import type { ValueStore } from "../../ports/value-store";

/** A value the firewall let through is always JSON; the store refusing it is a defect. */
function refused(): never {
  throw new Error("The store refused a value that had passed the output firewall.");
}

/** The `ValueStore` over the system of record: `values_latest` and `values_history`. */
export function createPostgresValueStore(db: Database): ValueStore {
  return {
    async readLatest(endpointId) {
      const latest = await readLatestValue(db, endpointId);
      if (latest === undefined) {
        return { value: null, consecutiveFailures: 0 };
      }
      const { value } = latest;
      return {
        value:
          value === null
            ? null
            : {
                data: value.data,
                asOf: value.as_of,
                fetchedAt: value.fetched_at,
                expiresAt: value.expires_at,
                recipeVersionId: value.recipe_version_id,
              },
        consecutiveFailures: latest.consecutive_failures,
      };
    },
    async storeRefreshed(endpointId, value) {
      const stored = await storeRefreshedValue(db, {
        endpoint_id: endpointId,
        value: {
          data: value.data,
          as_of: value.asOf,
          fetched_at: value.fetchedAt,
          expires_at: value.expiresAt,
          recipe_version_id: value.recipeVersionId,
        },
      });
      return stored.ok ? undefined : refused();
    },
    async appendHistory(entry) {
      const appended = await appendValueHistory(db, {
        id: entry.id,
        endpoint_id: entry.endpointId,
        data: entry.data,
        as_of: entry.asOf,
        recipe_version_id: entry.recipeVersionId,
      });
      return appended.ok ? undefined : refused();
    },
    recordFailure: (endpointId, error) =>
      recordRefreshFailure(db, { endpoint_id: endpointId, error }),
  };
}
