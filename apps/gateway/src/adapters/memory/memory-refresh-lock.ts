import type { EndpointId } from "@repo/core/ids/id";
import type { RefreshLock } from "../../ports/refresh-lock";

/**
 * A `RefreshLock` for one process: a caller that finds a refresh running waits for it to end,
 * then gets `null` and reads the value that refresh stored.
 */
export function createMemoryRefreshLock(): RefreshLock {
  const running = new Map<EndpointId, Promise<unknown>>();
  return {
    async withLock(endpointId, refresh) {
      const current = running.get(endpointId);
      if (current !== undefined) {
        await Promise.allSettled([current]);
        return null;
      }
      const work = refresh();
      running.set(endpointId, work);
      try {
        return await work;
      } finally {
        running.delete(endpointId);
      }
    },
  };
}
