import type { EndpointId } from "@repo/core/ids/id";

/**
 * Lets one refresh of an endpoint run at a time. `withLock` runs `refresh` and returns its
 * result, or returns `null` when another caller held the lock; by then that refresh has ended
 * or has had a short while to end, so the caller reads the stored value instead.
 */
export interface RefreshLock {
  withLock<Result>(endpointId: EndpointId, refresh: () => Promise<Result>): Promise<Result | null>;
}
