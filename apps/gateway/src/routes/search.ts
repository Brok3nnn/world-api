import type { SearchPage } from "@repo/contracts/search/search-page";
import { searchParametersSchema } from "@repo/contracts/search/search-parameters";
import { limitRate } from "../pipeline/limit-rate";
import { readQuery } from "../pipeline/read-query";
import { errorResponse } from "../responses/error-response";
import type { Route } from "./route";

const QUERY_HINT =
  "Use q with 1 to 200 characters, limit from 1 to 50, and the cursor of a previous page.";

/**
 * `GET /search?q=`: public endpoints that answer calls, best match first, each with its permanent
 * URL on the origin the call came in on. Free, but within the caller's rate.
 */
export const searchRoute: Route = {
  matches: (pathname) => pathname === "/search",
  handle: async (request, { deps, client }) => {
    const url = new URL(request.url);
    const query = readQuery(url, ["q", "limit", "cursor"]);
    const parameters = query.ok ? searchParametersSchema.safeParse(query.value) : null;
    if (!query.ok || parameters === null || !parameters.success) {
      return errorResponse(
        query.ok
          ? { code: "invalid_request", message: "The search is not valid.", hint: QUERY_HINT }
          : query.error,
      );
    }
    const allowed = await limitRate(await deps.callers.identify(request, client), deps.rateLimiter);
    if (!allowed.ok) {
      return errorResponse(allowed.error);
    }
    const { q, limit, cursor } = parameters.data;
    const found = await deps.search.search({
      words: q,
      limit,
      ...(cursor === undefined ? {} : { cursor }),
    });
    if (!found.ok) {
      return errorResponse({
        code: "invalid_request",
        message: "The cursor is not valid.",
        hint: "Pass back the next_cursor of the previous page unchanged.",
      });
    }
    const page: SearchPage = {
      items: found.value.items.map(({ priceCredits, ...match }) => ({
        ...match,
        url: `${url.origin}/@${match.owner}/${match.slug}`,
        price_credits: priceCredits,
      })),
      next_cursor: found.value.nextCursor,
    };
    return Response.json(page, { headers: { "cache-control": "public, max-age=60" } });
  },
};
