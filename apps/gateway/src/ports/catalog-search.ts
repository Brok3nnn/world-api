import type { Result } from "@repo/core/result";

/** A page of matches, each as a result list shows it, and the cursor of the next page. */
interface SearchResults {
  readonly items: readonly {
    readonly owner: string;
    readonly slug: string;
    readonly title: string;
    readonly summary: string;
    readonly priceCredits: number;
  }[];
  readonly nextCursor: string | null;
}

/** Finds public endpoints that answer calls by words, best match first. */
export interface CatalogSearch {
  search(query: {
    readonly words: string;
    readonly limit: number;
    readonly cursor?: string;
  }): Promise<Result<SearchResults, { readonly code: "invalid_cursor" }>>;
}
