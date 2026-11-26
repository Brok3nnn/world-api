import { err, ok } from "@repo/core/result";
import type { EndpointData, EndpointReader } from "../endpoint-reader";

/** An `EndpointReader` over a table of values; any other reference is unavailable. */
export function createFakeEndpointReader(
  values: Readonly<Record<string, EndpointData>>,
): EndpointReader {
  return async (ref) => {
    const value = values[ref];
    return value === undefined ? err({ code: "endpoint_unavailable" }) : ok(value);
  };
}
