import type { SourceId } from "@repo/core/ids/id";
import type { Clock } from "@repo/core/time/clock";
import type { SourceRateLimiter } from "../../ports/source-rate-limiter";

const MINUTE_MS = 60_000;

/**
 * A `SourceRateLimiter` for one gateway process: each source gets its limit of requests in every
 * minute that starts with its first request. Stage 2 moves the counts to a shared coordinator.
 */
export function createMemorySourceRateLimiter(clock: Clock): SourceRateLimiter {
  const windows = new Map<SourceId, { readonly startedAt: number; readonly count: number }>();
  return {
    allow(sourceId, perMinute) {
      const now = clock.now().getTime();
      const current = windows.get(sourceId);
      const window =
        current === undefined || now - current.startedAt >= MINUTE_MS
          ? { startedAt: now, count: 0 }
          : current;
      if (window.count >= perMinute) {
        return false;
      }
      windows.set(sourceId, { ...window, count: window.count + 1 });
      return true;
    },
  };
}
