import { effectiveMaxAge } from "@repo/core/freshness/effective-max-age";
import { isStale } from "@repo/core/freshness/is-stale";
import type { Clock } from "@repo/core/time/clock";
import type { ServedEndpoint } from "../ports/endpoint-directory";
import type { LatestValue, StoredValue, ValueStore } from "../ports/value-store";

/** What reading found: a value fresh enough for the call, or the state a refresh starts from. */
export type ValueReading =
  | { readonly fresh: true; readonly value: StoredValue }
  | { readonly fresh: false; readonly latest: LatestValue };

/**
 * Reads the endpoint's latest value with one store read and decides, with the freshness rules
 * of `packages/core`, whether it can be returned as it is. `max_age` may accept an older value
 * but never forces a refresh sooner than the endpoint's freshness interval.
 */
export async function readValue(
  endpoint: ServedEndpoint,
  maxAgeS: number | undefined,
  deps: { readonly values: ValueStore; readonly clock: Clock },
): Promise<ValueReading> {
  const latest = await deps.values.readLatest(endpoint.id);
  const acceptedAgeS = effectiveMaxAge(endpoint.definition.freshness, maxAgeS);
  if (latest.value !== null && !isStale(latest.value.fetchedAt, acceptedAgeS, deps.clock.now())) {
    return { fresh: true, value: latest.value };
  }
  return { fresh: false, latest };
}
