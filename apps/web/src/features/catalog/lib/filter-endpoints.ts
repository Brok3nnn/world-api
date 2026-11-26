import { matchesAllTerms } from "@/lib/text-search";
import { CATEGORIES } from "../constants";
import type { CategoryId, Endpoint, EndpointSort, EndpointSummary } from "../types";

/** True when every term of `query` appears in the endpoint's title, summary, handle, slug, category or tags. */
function matchesQuery(endpoint: EndpointSummary, query: string): boolean {
  const haystack = [
    endpoint.title,
    endpoint.summary,
    `@${endpoint.publisherHandle}/${endpoint.slug}`,
    CATEGORIES[endpoint.category].label,
    ...endpoint.tags,
  ].join(" ");
  return matchesAllTerms(haystack, query);
}

interface EndpointFilter {
  query?: string;
  category?: CategoryId | null;
}

export function filterEndpoints<T extends EndpointSummary>(
  endpoints: readonly T[],
  { query = "", category = null }: EndpointFilter,
): T[] {
  return endpoints.filter(
    (endpoint) =>
      (category === null || endpoint.category === category) && matchesQuery(endpoint, query),
  );
}

const SORT_COMPARATORS: Record<EndpointSort, (a: Endpoint, b: Endpoint) => number> = {
  popular: (a, b) => b.stats.paidCalls30d - a.stats.paidCalls30d,
  liked: (a, b) => b.stats.likes - a.stats.likes,
  trending: (a, b) => b.stats.callsTrend - a.stats.callsTrend,
  newest: (a, b) => b.publishedAt.localeCompare(a.publishedAt),
};

export function sortEndpoints(endpoints: readonly Endpoint[], sort: EndpointSort): Endpoint[] {
  return [...endpoints].sort(SORT_COMPARATORS[sort]);
}

export function countByCategory(endpoints: readonly Endpoint[]): Map<CategoryId, number> {
  const counts = new Map<CategoryId, number>();
  for (const endpoint of endpoints) {
    counts.set(endpoint.category, (counts.get(endpoint.category) ?? 0) + 1);
  }
  return counts;
}
