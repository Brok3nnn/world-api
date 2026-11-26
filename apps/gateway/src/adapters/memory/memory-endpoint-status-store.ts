import type { EndpointStatus } from "@repo/contracts/endpoint/endpoint-status";
import type { EndpointId } from "@repo/core/ids/id";
import type { EndpointStatusStore } from "../../ports/endpoint-status-store";

/** An `EndpointStatusStore` over statuses kept in memory, for tests and local runs. */
export function createMemoryEndpointStatusStore(
  initial: Iterable<readonly [EndpointId, EndpointStatus]> = [],
): EndpointStatusStore {
  const statuses = new Map(initial);
  return {
    move: async (endpointId, from, to) => {
      if (statuses.get(endpointId) !== from) {
        return false;
      }
      statuses.set(endpointId, to);
      return true;
    },
  };
}
