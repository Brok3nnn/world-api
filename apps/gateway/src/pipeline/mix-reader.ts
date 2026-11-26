import { err, ok, type Result } from "@repo/core/result";
import { chainedEndpointReader } from "@repo/recipes/engine/chained-endpoint-reader";
import type { EndpointReader } from "@repo/recipes/ports/endpoint-reader";
import type { GatewayDeps } from "../gateway-deps";
import type { ServedEndpoint } from "../ports/endpoint-directory";
import type { StoredValue } from "../ports/value-store";
import type { ErrorAnswer } from "../responses/error-response";
import { readValue } from "./read-value";
import { resolveEndpoint } from "./resolve-endpoint";

/** How a call refreshes an endpoint; passed in, as refreshing a mix reads through this reader. */
export type Refresh = (
  endpoint: ServedEndpoint,
  call: { readonly maxAgeS: number | undefined; readonly chain: readonly string[] },
  deps: GatewayDeps,
) => Promise<Result<StoredValue, ErrorAnswer>>;

/**
 * The `readEndpoint` of a run of the last endpoint in `chain`. A read goes through the pipeline
 * as a call would: resolve the endpoint, read its value, refresh it if it is not fresh, with the
 * longer chain. Loops and deep nesting are refused by `chainedEndpointReader`; an endpoint that
 * cannot answer is `endpoint_unavailable`.
 */
export function mixReader(
  chain: readonly string[],
  deps: GatewayDeps,
  refresh: Refresh,
): EndpointReader {
  return chainedEndpointReader(chain, async (ref, longer) => {
    const [owner = "", slug = ""] = ref.slice(1).split("/");
    const endpoint = await resolveEndpoint({ owner, slug }, deps.endpoints);
    if (!endpoint.ok) {
      return err({ code: "endpoint_unavailable" });
    }
    const reading = await readValue(endpoint.value, undefined, deps);
    const value = reading.fresh
      ? ok(reading.value)
      : await refresh(endpoint.value, { maxAgeS: undefined, chain: longer }, deps);
    return value.ok ? ok(value.value.data) : err({ code: "endpoint_unavailable" });
  });
}
