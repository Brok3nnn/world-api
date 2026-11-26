import type { Endpoint, Publisher } from "@/features/catalog/types";
import type { PublisherRanking } from "../types";

/**
 * Ranks publishers by paid calls over the last 30 days, the main ranking signal.
 * Publishers without endpoints are left out.
 */
export function rankPublishers(
  publishers: readonly Publisher[],
  endpoints: readonly Endpoint[],
): PublisherRanking[] {
  return publishers
    .map((publisher) => {
      const owned = endpoints.filter((endpoint) => endpoint.publisherHandle === publisher.handle);
      return {
        publisher,
        endpointCount: owned.length,
        paidCalls30d: sum(owned, (endpoint) => endpoint.stats.paidCalls30d),
        averageUptime:
          owned.length > 0 ? sum(owned, (endpoint) => endpoint.stats.uptime) / owned.length : 0,
        totalLikes: sum(owned, (endpoint) => endpoint.stats.likes),
      };
    })
    .filter((entry) => entry.endpointCount > 0)
    .sort((a, b) => b.paidCalls30d - a.paidCalls30d)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

function sum<Item>(items: readonly Item[], value: (item: Item) => number): number {
  return items.reduce((total, item) => total + value(item), 0);
}
