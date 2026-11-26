"use client";

import { useQueryStates } from "nuqs";
import { filterEndpoints, sortEndpoints } from "@/features/catalog/lib/filter-endpoints";
import type { CategoryId, Endpoint } from "@/features/catalog/types";
import { marketplaceSearchParams } from "../search-params";
import { CategoryTabs } from "./category-tabs";
import { EndpointGrid } from "./endpoint-grid";
import { MarketplaceEmptyState } from "./marketplace-empty-state";
import { MarketplaceSearchInput } from "./marketplace-search-input";
import { SortSelect } from "./sort-select";

interface MarketplaceBrowserProps {
  endpoints: readonly Endpoint[];
  /** Categories that have at least one endpoint, in display order. */
  categories: readonly CategoryId[];
}

/** Category tabs, search and sort bound to the URL, plus the matching cards. */
export function MarketplaceBrowser({ endpoints, categories }: MarketplaceBrowserProps) {
  const [{ q, category, sort }, setParams] = useQueryStates(marketplaceSearchParams);
  const results = sortEndpoints(filterEndpoints(endpoints, { query: q, category }), sort);

  return (
    <section aria-label="Catalog" className="flex flex-col gap-6">
      <CategoryTabs categories={categories} active={category} params={{ q, sort }} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <MarketplaceSearchInput
          value={q}
          onValueChange={(value) => setParams({ q: value })}
          className="sm:max-w-sm"
        />
        <p aria-live="polite" className="text-muted-foreground text-sm sm:ml-auto">
          {results.length} {results.length === 1 ? "API" : "APIs"}
        </p>
        <SortSelect value={sort} onValueChange={(value) => setParams({ sort: value })} />
      </div>

      {results.length === 0 ? (
        <MarketplaceEmptyState
          query={q}
          onClearFilters={() => setParams({ q: null, category: null })}
        />
      ) : (
        <EndpointGrid endpoints={results} />
      )}
    </section>
  );
}
