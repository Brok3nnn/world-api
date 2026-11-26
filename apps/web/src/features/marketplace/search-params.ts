import type { Route } from "next";
import {
  createSerializer,
  type inferParserType,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";
import { CATEGORY_IDS, SORT_IDS } from "@/features/catalog/constants";

/** URL contract of the /marketplace page. A missing `category` means all categories. */
export const marketplaceSearchParams = {
  q: parseAsString.withDefault(""),
  category: parseAsStringLiteral(CATEGORY_IDS),
  sort: parseAsStringLiteral(SORT_IDS).withDefault("popular"),
};

export type MarketplaceParams = inferParserType<typeof marketplaceSearchParams>;

const serializeMarketplaceParams = createSerializer(marketplaceSearchParams, {
  clearOnDefault: true,
});

/** e.g. marketplaceUrl({ category: "wildlife" }) → "/marketplace?category=wildlife" */
export function marketplaceUrl(params: Partial<MarketplaceParams> = {}): Route {
  // The serializer only appends known query params to a static route, so the result is a valid Route.
  return serializeMarketplaceParams("/marketplace", params) as Route;
}
