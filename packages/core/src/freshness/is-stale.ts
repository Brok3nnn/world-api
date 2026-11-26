import { secondsBetween } from "../time/duration";

/**
 * Whether a stored value is too old to return as it is. A value is stale from the instant its
 * age reaches the accepted maximum, the same instant `next_refresh` names.
 */
export function isStale(fetchedAt: Date, maxAgeS: number, now: Date): boolean {
  return secondsBetween(fetchedAt, now) >= maxAgeS;
}
