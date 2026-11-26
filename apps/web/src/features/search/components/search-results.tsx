import Link from "next/link";
import { builderUrl } from "@/features/builder/search-params";
import { EndpointCard } from "@/features/catalog/components/endpoint-card";
import { CATEGORIES, CATEGORY_IDS } from "@/features/catalog/constants";
import { countByCategory, filterEndpoints } from "@/features/catalog/lib/filter-endpoints";
import { matchesPublisher } from "@/features/catalog/lib/filter-publishers";
import type { Endpoint, Publisher } from "@/features/catalog/types";
import { formatNumber } from "@/lib/format";
import { CategoryButton } from "./category-button";
import { PublisherResultCard } from "./publisher-result-card";
import { SearchNoResults } from "./search-no-results";
import { SearchResultSection } from "./search-result-section";

interface SearchResultsProps {
  /** Trimmed, non-empty query. */
  query: string;
  endpoints: readonly Endpoint[];
  publishers: readonly Publisher[];
  onQueryChange: (query: string) => void;
}

/** Endpoint, publisher and category matches for a query, or the build offer when none match. */
export function SearchResults({ query, endpoints, publishers, onQueryChange }: SearchResultsProps) {
  const endpointMatches = filterEndpoints(endpoints, { query });
  const publisherMatches = publishers.filter((publisher) => matchesPublisher(publisher, query));
  const categoryMatches = CATEGORY_IDS.filter((category) =>
    CATEGORIES[category].label.toLowerCase().includes(query.toLowerCase()),
  );
  const total = endpointMatches.length + publisherMatches.length + categoryMatches.length;
  const categoryCounts = countByCategory(endpoints);

  return (
    <div className="flex flex-col gap-12">
      <output
        aria-live="polite"
        className={total === 0 ? "sr-only" : "block text-center text-muted-foreground text-sm"}
      >
        {formatNumber(total)} {total === 1 ? "result" : "results"} for “{query}”
      </output>

      {total === 0 ? <SearchNoResults query={query} /> : null}

      {endpointMatches.length > 0 ? (
        <SearchResultSection title="APIs" count={endpointMatches.length}>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {endpointMatches.map((endpoint) => (
              <li key={endpoint.id} className="flex">
                <EndpointCard endpoint={endpoint} className="flex-1" />
              </li>
            ))}
          </ul>
        </SearchResultSection>
      ) : null}

      {publisherMatches.length > 0 ? (
        <SearchResultSection title="Publishers" count={publisherMatches.length}>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {publisherMatches.map((publisher) => (
              <li key={publisher.handle}>
                <PublisherResultCard
                  publisher={publisher}
                  endpointCount={
                    endpoints.filter((endpoint) => endpoint.publisherHandle === publisher.handle)
                      .length
                  }
                />
              </li>
            ))}
          </ul>
        </SearchResultSection>
      ) : null}

      {categoryMatches.length > 0 ? (
        <SearchResultSection title="Categories" count={categoryMatches.length}>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categoryMatches.map((category) => (
              <li key={category}>
                <CategoryButton
                  category={category}
                  count={categoryCounts.get(category) ?? 0}
                  onSelect={() => onQueryChange(CATEGORIES[category].label)}
                />
              </li>
            ))}
          </ul>
        </SearchResultSection>
      ) : null}

      {total > 0 ? (
        <p className="text-center text-muted-foreground text-sm">
          Not what you need?{" "}
          <Link
            href={builderUrl({ q: query })}
            className="rounded-sm text-violet-700 underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Build an API for “{query}”
          </Link>
        </p>
      ) : null}
    </div>
  );
}
