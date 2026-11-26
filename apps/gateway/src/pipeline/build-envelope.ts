import type { Envelope } from "@repo/contracts/api/envelope";
import { nextRefresh } from "@repo/core/freshness/next-refresh";
import type { ServedEndpoint } from "../ports/endpoint-directory";
import type { StoredValue } from "../ports/value-store";

/**
 * The envelope of `api.md` for a stored value of an endpoint. Each source is credited with its
 * name, URL, licence and required attribution, and nothing else the registry keeps about it.
 */
export function buildEnvelope(endpoint: ServedEndpoint, value: StoredValue): Envelope {
  const { freshness, method, price_credits } = endpoint.definition;
  return {
    data: value.data,
    as_of: value.asOf.toISOString(),
    sources: endpoint.sources.map(({ name, url, licence, attribution }) => ({
      name,
      url,
      licence,
      attribution,
    })),
    next_refresh: nextRefresh(value.fetchedAt, freshness).toISOString(),
    method,
    price_credits,
  };
}
