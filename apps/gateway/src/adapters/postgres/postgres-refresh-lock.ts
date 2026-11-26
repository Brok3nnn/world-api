import type { Database } from "@repo/db/client/database";
import { withEndpointLock } from "@repo/db/queries/lock/with-endpoint-lock";
import type { Wait } from "@repo/recipes/ports/wait";
import type { RefreshLock } from "../../ports/refresh-lock";

/** How long a caller that finds another instance refreshing waits before reading the value. */
const WAIT_FOR_REFRESH_MS = 1_000;

/**
 * The `RefreshLock` across instances: an advisory lock per endpoint. A caller that finds it held
 * by another instance waits a short while, then gets `null` and reads the stored value.
 */
export function createPostgresRefreshLock(db: Database, wait: Wait): RefreshLock {
  return {
    async withLock(endpointId, refresh) {
      const result = await withEndpointLock(db, endpointId, async () => ({
        value: await refresh(),
      }));
      if (result === null) {
        await wait(WAIT_FOR_REFRESH_MS, new AbortController().signal);
        return null;
      }
      return result.value;
    },
  };
}
