import type { EndpointStatus } from "@repo/contracts/endpoint/endpoint-status";

/**
 * The statuses an endpoint may move to from each status. A build makes it `live`; refreshes
 * move it between `live` and `degraded`; its owner disables and re-enables it.
 */
export const ENDPOINT_TRANSITIONS = {
  building: ["live"],
  live: ["degraded", "disabled"],
  degraded: ["live", "disabled"],
  disabled: ["live"],
} as const satisfies Record<EndpointStatus, readonly EndpointStatus[]>;
