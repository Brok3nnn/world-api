import type { Clock } from "@repo/core/time/clock";
import type { RateLimiter } from "../../ports/rate-limiter";

/** Keys kept at most; the one used longest ago makes room, as it has refilled the longest. */
const MAX_KEYS = 10_000;
const MS_PER_S = 1000;

interface Bucket {
  readonly tokens: number;
  readonly at: number;
}

/**
 * A token bucket per key, in the memory of one process and nowhere else: a network address
 * used as a key is never written down. Stage 2 moves the buckets to a shared coordinator.
 */
export function createMemoryRateLimiter(clock: Clock): RateLimiter {
  const buckets = new Map<string, Bucket>();
  return {
    take: async (key, rate) => {
      const now = clock.now().getTime();
      const last = buckets.get(key);
      const refilled =
        last === undefined
          ? rate.burst
          : last.tokens + ((now - last.at) / MS_PER_S) * rate.perSecond;
      const tokens = Math.min(rate.burst, refilled);
      buckets.delete(key);
      if (buckets.size >= MAX_KEYS) {
        const [oldest] = buckets.keys();
        buckets.delete(oldest ?? key);
      }
      if (tokens < 1) {
        buckets.set(key, { tokens, at: now });
        return { allowed: false, retryAfterS: Math.ceil((1 - tokens) / rate.perSecond) };
      }
      buckets.set(key, { tokens: tokens - 1, at: now });
      return { allowed: true };
    },
  };
}
