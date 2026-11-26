import { sortEndpoints } from "@/features/catalog/lib/filter-endpoints";
import type { Endpoint } from "@/features/catalog/types";

/**
 * Endpoints to suggest next to one: the most called of the same category first, topped up with
 * the most called of the rest so the row is always full.
 */
export function selectRelatedEndpoints(
  endpoint: Endpoint,
  endpoints: readonly Endpoint[],
  limit: number,
): Endpoint[] {
  const others = sortEndpoints(
    endpoints.filter((candidate) => candidate.id !== endpoint.id),
    "popular",
  );
  const sameCategory = others.filter((candidate) => candidate.category === endpoint.category);
  const rest = others.filter((candidate) => candidate.category !== endpoint.category);
  return [...sameCategory, ...rest].slice(0, limit);
}
