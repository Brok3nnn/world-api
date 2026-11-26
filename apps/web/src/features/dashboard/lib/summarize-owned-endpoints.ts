import type { DashboardSummary, OwnedEndpoint } from "../types";

export function summarizeOwnedEndpoints(endpoints: readonly OwnedEndpoint[]): DashboardSummary {
  const uptimes = endpoints.flatMap((endpoint) =>
    endpoint.uptime === null ? [] : [endpoint.uptime],
  );

  return {
    paidCalls30d: endpoints.reduce((sum, endpoint) => sum + endpoint.paidCalls30d, 0),
    liveEndpoints: endpoints.filter((endpoint) => endpoint.status === "live").length,
    averageUptime:
      uptimes.length > 0 ? uptimes.reduce((sum, uptime) => sum + uptime, 0) / uptimes.length : null,
  };
}
