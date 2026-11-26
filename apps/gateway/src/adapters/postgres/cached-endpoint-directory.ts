import type { Clock } from "@repo/core/time/clock";
import type { EndpointDirectory, ServedEndpoint } from "../../ports/endpoint-directory";

/** How long an answer is kept, and how many are kept at most (gateway.md, Caching). */
export const DIRECTORY_CACHE = { lifetimeMs: 30_000, maxEntries: 1_000 } as const;

interface Kept {
  readonly endpoint: ServedEndpoint | null;
  readonly expiresAt: number;
}

/**
 * An `EndpointDirectory` that keeps each answer, an unknown endpoint included, for a short time,
 * so a hot endpoint costs no lookup. When full, the oldest answer makes room.
 */
export function createCachedEndpointDirectory(
  inner: EndpointDirectory,
  clock: Clock,
): EndpointDirectory {
  const kept = new Map<string, Kept>();
  return {
    async find(path) {
      const key = `${path.owner}/${path.slug}`;
      const now = clock.now().getTime();
      const hit = kept.get(key);
      if (hit !== undefined && hit.expiresAt > now) {
        return hit.endpoint;
      }
      const endpoint = await inner.find(path);
      kept.delete(key);
      if (kept.size >= DIRECTORY_CACHE.maxEntries) {
        const [oldest] = kept.keys();
        kept.delete(oldest ?? key);
      }
      kept.set(key, { endpoint, expiresAt: now + DIRECTORY_CACHE.lifetimeMs });
      return endpoint;
    },
  };
}
