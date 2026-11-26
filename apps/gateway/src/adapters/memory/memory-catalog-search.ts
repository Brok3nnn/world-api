import { err, ok } from "@repo/core/result";
import type { CatalogSearch } from "../../ports/catalog-search";
import type { ServedEndpoint } from "../../ports/endpoint-directory";

const WORD = /[\p{L}\p{N}]+/gu;

function wordsOf(text: string): string[] {
  return text.toLowerCase().match(WORD) ?? [];
}

/**
 * A `CatalogSearch` over a fixed list, for tests and local runs: an endpoint matches when its
 * title, summary and category hold every word of the query. The cursor is the next offset.
 */
export function createMemoryCatalogSearch(endpoints: readonly ServedEndpoint[]): CatalogSearch {
  return {
    search: async ({ words, limit, cursor }) => {
      const offset = cursor === undefined ? 0 : Number(cursor);
      if (cursor !== undefined && !(Number.isInteger(offset) && offset > 0)) {
        return err({ code: "invalid_cursor" });
      }
      const wanted = wordsOf(words);
      const matches = endpoints.filter(({ definition }) => {
        const answers =
          definition.visibility === "public" &&
          (definition.status === "live" || definition.status === "degraded");
        const found = wordsOf(`${definition.title} ${definition.summary} ${definition.category}`);
        return answers && wanted.length > 0 && wanted.every((word) => found.includes(word));
      });
      const page = matches.slice(offset, offset + limit).map(({ definition }) => ({
        owner: definition.owner,
        slug: definition.slug,
        title: definition.title,
        summary: definition.summary,
        priceCredits: definition.price_credits,
      }));
      return ok({
        items: page,
        nextCursor: matches.length > offset + limit ? String(offset + limit) : null,
      });
    },
  };
}
