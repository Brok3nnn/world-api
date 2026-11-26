import { err, type Result } from "@repo/core/result";
import type { EndpointData, EndpointReader, EndpointReadFailure } from "../ports/endpoint-reader";
import { RUN_LIMITS } from "./run-limits";

/**
 * Reads an endpoint's value on behalf of a run. `chain` lists the endpoints whose runs led to
 * this read, ending with the endpoint read; a reader that refreshes the value passes it on to
 * the run it starts.
 */
export type ChainedRead = (
  ref: string,
  chain: readonly string[],
) => Promise<Result<EndpointData, EndpointReadFailure>>;

/**
 * The `readEndpoint` port of a run of the last endpoint in `chain`, `@owner/slug` each. It
 * refuses with `limit_exceeded` a read that would loop back to an endpoint of the chain, or nest
 * deeper than `RUN_LIMITS.endpointReadDepth`.
 */
export function chainedEndpointReader(chain: readonly string[], read: ChainedRead): EndpointReader {
  return async (ref) => {
    if (chain.includes(ref) || chain.length > RUN_LIMITS.endpointReadDepth) {
      return err({ code: "limit_exceeded" });
    }
    return read(ref, [...chain, ref]);
  };
}
