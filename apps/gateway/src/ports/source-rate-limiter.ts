import type { SourceId } from "@repo/core/ids/id";

/** Counts requests per source and says whether one more may be sent within its limit. */
export interface SourceRateLimiter {
  allow(sourceId: SourceId, perMinute: number): boolean;
}
