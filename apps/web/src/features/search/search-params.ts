import type { Route } from "next";
import { createSerializer, type inferParserType, parseAsString } from "nuqs/server";

/** URL contract of the /search page. */
export const searchSearchParams = {
  q: parseAsString.withDefault(""),
};

export type SearchParams = inferParserType<typeof searchSearchParams>;

const serializeSearchParams = createSerializer(searchSearchParams, { clearOnDefault: true });

export function searchUrl(params: Partial<SearchParams> = {}): Route {
  // The serializer only appends known query params to a static route, so the result is a valid Route.
  return serializeSearchParams("/search", params) as Route;
}
