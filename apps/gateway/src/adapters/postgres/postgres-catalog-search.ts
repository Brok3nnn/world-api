import { err, ok } from "@repo/core/result";
import type { Database } from "@repo/db/client/database";
import { searchCatalogEndpoints } from "@repo/db/queries/endpoint/search-catalog-endpoints";
import type { CatalogSearch } from "../../ports/catalog-search";

/** The `CatalogSearch` over the full-text index of `endpoints`. */
export function createPostgresCatalogSearch(db: Database): CatalogSearch {
  return {
    async search({ words, limit, cursor }) {
      const found = await searchCatalogEndpoints(db, {
        query: words,
        limit,
        ...(cursor === undefined ? {} : { cursor }),
      });
      if (!found.ok) {
        return err(found.error);
      }
      const items = found.value.items.map(({ price_credits, ...match }) => ({
        ...match,
        priceCredits: price_credits,
      }));
      return ok({ items, nextCursor: found.value.nextCursor });
    },
  };
}
