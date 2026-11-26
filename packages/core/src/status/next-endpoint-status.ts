import type { EndpointStatus } from "@repo/contracts/endpoint/endpoint-status";

/** This many refresh failures in a row degrade an endpoint. */
export const FAILURES_BEFORE_DEGRADED = 3;

/**
 * The status of an endpoint after a refresh. `consecutiveFailures` includes the failure that
 * just happened. A success always restores `live`; the third failure in a row degrades. A
 * refresh never changes an endpoint that is still building or is disabled.
 */
export function nextEndpointStatus(
  current: EndpointStatus,
  outcome: "success" | "failure",
  consecutiveFailures: number,
): EndpointStatus {
  if (current !== "live" && current !== "degraded") {
    return current;
  }
  if (outcome === "success") {
    return "live";
  }
  return consecutiveFailures >= FAILURES_BEFORE_DEGRADED ? "degraded" : current;
}
