import { ok } from "@repo/core/result";
import { mixReader, type Refresh } from "./mix-reader";
import { readValue } from "./read-value";
import { refreshValue, servedWithinGrace } from "./refresh-value";

/**
 * Refreshes a value that is not fresh enough, once for any number of concurrent calls. The
 * caller holding the endpoint's lock reads again first, since a refresh may have just ended,
 * and refreshes only if it must. Every other caller reads the value that refresh stored, or the
 * stored one within its grace period. `chain` lists the endpoints whose runs led here, ending
 * with this one, so a mix cannot read in a loop.
 */
export const refreshOnce: Refresh = async (endpoint, { maxAgeS, chain }, deps) => {
  const refreshed = await deps.locks.withLock(endpoint.id, async () => {
    const reading = await readValue(endpoint, maxAgeS, deps);
    const readEndpoint = mixReader(chain, deps, refreshOnce);
    return reading.fresh
      ? ok(reading.value)
      : refreshValue(endpoint, reading.latest, { ...deps, readEndpoint });
  });
  if (refreshed !== null) {
    return refreshed;
  }
  const after = await readValue(endpoint, maxAgeS, deps);
  return after.fresh
    ? ok(after.value)
    : servedWithinGrace(endpoint, after.latest, deps.clock.now());
};
