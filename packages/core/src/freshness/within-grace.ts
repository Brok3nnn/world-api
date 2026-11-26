import type { Freshness } from "@repo/contracts/endpoint/freshness";
import { secondsBetween } from "../time/duration";
import { FRESHNESS_SECONDS } from "./freshness-seconds";

/** How many freshness intervals after its expiry a value may still be served. */
export const GRACE_INTERVALS = 3;

/**
 * Whether a stored value may still be served while its source is failing: until three
 * freshness intervals have passed since it expired.
 */
export function withinGrace(fetchedAt: Date, freshness: Freshness, now: Date): boolean {
  const servableForS = FRESHNESS_SECONDS[freshness] * (1 + GRACE_INTERVALS);
  return secondsBetween(fetchedAt, now) < servableForS;
}
