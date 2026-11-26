import { sortEndpoints } from "@/features/catalog/lib/filter-endpoints";
import type { CategoryId, Endpoint } from "@/features/catalog/types";
import { CategoryTabs } from "./category-tabs";
import { EndpointGrid } from "./endpoint-grid";

interface MarketplaceBrowserFallbackProps {
  endpoints: readonly Endpoint[];
  categories: readonly CategoryId[];
}

/**
 * Prerendered stand-in while the URL-driven browser loads: the tabs, a placeholder toolbar and the
 * default (most called) grid, so the catalog is in the initial HTML.
 */
export function MarketplaceBrowserFallback({
  endpoints,
  categories,
}: MarketplaceBrowserFallbackProps) {
  return (
    <div className="flex flex-col gap-6">
      <CategoryTabs categories={categories} active={null} />
      <div aria-hidden className="h-10 rounded-full bg-ink-50 ring-1 ring-border sm:max-w-sm" />
      <EndpointGrid endpoints={sortEndpoints(endpoints, "popular")} />
    </div>
  );
}
