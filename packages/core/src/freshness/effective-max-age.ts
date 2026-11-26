import type { Freshness } from "@repo/contracts/endpoint/freshness";
import { FRESHNESS_SECONDS } from "./freshness-seconds";

/**
 * The oldest value a call accepts, in seconds. Without `max_age` it is the endpoint's freshness
 * interval. A larger `max_age` lets the caller accept an older value without a refresh. A
 * smaller one is raised to the interval, the freshness floor: no caller can force refreshes
 * more often than the endpoint's class allows.
 */
export function effectiveMaxAge(freshness: Freshness, requestedMaxAgeS?: number): number {
  const floor = FRESHNESS_SECONDS[freshness];
  return requestedMaxAgeS === undefined ? floor : Math.max(requestedMaxAgeS, floor);
}
