import { CATEGORIES, CATEGORY_IDS } from "@/features/catalog/constants";
import { countByCategory } from "@/features/catalog/lib/filter-endpoints";
import type { Endpoint } from "@/features/catalog/types";
import { POPULAR_SEARCHES } from "../constants";
import { CategoryButton } from "./category-button";

interface SearchSuggestionsProps {
  endpoints: readonly Endpoint[];
  onQueryChange: (query: string) => void;
}

/** Shown while the query is empty: popular searches and every category. */
export function SearchSuggestions({ endpoints, onQueryChange }: SearchSuggestionsProps) {
  const counts = countByCategory(endpoints);

  return (
    <div className="flex flex-col gap-12">
      <section
        aria-labelledby="popular-searches-title"
        className="flex flex-col items-center gap-3"
      >
        <h2 id="popular-searches-title" className="font-medium text-muted-foreground text-xs">
          Popular searches
        </h2>
        <ul className="flex flex-wrap justify-center gap-2">
          {POPULAR_SEARCHES.map((search) => (
            <li key={search}>
              <button
                type="button"
                onClick={() => onQueryChange(search)}
                className="rounded-full bg-ink-50 px-3 py-1.5 text-ink-700 text-sm ring-1 ring-border transition-colors outline-none hover:bg-ink-100 focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {search}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="browse-categories-title" className="flex flex-col gap-4">
        <h2 id="browse-categories-title" className="font-heading text-2xl text-ink-950">
          Browse by category
        </h2>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORY_IDS.map((category) => (
            <li key={category}>
              <CategoryButton
                category={category}
                count={counts.get(category) ?? 0}
                onSelect={() => onQueryChange(CATEGORIES[category].label)}
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
