import type { EndpointId } from "@repo/core/ids/id";
import type { HistoryEntry, LatestValue, ValueStore } from "../../ports/value-store";

/** A `ValueStore` in memory, for tests and local runs, with its history open to assertions. */
export interface MemoryValueStore extends ValueStore {
  readonly history: readonly HistoryEntry[];
}

export function createMemoryValueStore(
  initial: ReadonlyMap<EndpointId, LatestValue> = new Map(),
): MemoryValueStore {
  const latest = new Map(initial);
  const history: HistoryEntry[] = [];
  return {
    history,
    readLatest: async (endpointId) =>
      latest.get(endpointId) ?? { value: null, consecutiveFailures: 0 },
    storeRefreshed: async (endpointId, value) => {
      latest.set(endpointId, { value, consecutiveFailures: 0 });
    },
    appendHistory: async (entry) => {
      history.push(entry);
    },
    recordFailure: async (endpointId) => {
      const current = latest.get(endpointId);
      const consecutiveFailures = (current?.consecutiveFailures ?? 0) + 1;
      latest.set(endpointId, { value: current?.value ?? null, consecutiveFailures });
      return consecutiveFailures;
    },
  };
}
