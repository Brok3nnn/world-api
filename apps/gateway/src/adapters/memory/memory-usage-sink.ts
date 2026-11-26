import { ok } from "@repo/core/result";
import type { UsageEvent, UsageSink } from "../../ports/usage-sink";

/** A `UsageSink` in memory, for tests and local runs, with its events open to assertions. */
export interface MemoryUsageSink extends UsageSink {
  readonly events: readonly UsageEvent[];
}

export function createMemoryUsageSink(): MemoryUsageSink {
  const events: UsageEvent[] = [];
  return {
    events,
    record: async (event) => {
      events.push(event);
      return ok(undefined);
    },
  };
}
