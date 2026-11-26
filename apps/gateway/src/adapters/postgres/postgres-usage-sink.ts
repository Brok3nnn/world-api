import { err, ok } from "@repo/core/result";
import type { Database } from "@repo/db/client/database";
import { appendUsageEvent } from "@repo/db/queries/usage/append-usage-event";
import type { UsageSink } from "../../ports/usage-sink";

/** The `UsageSink` over `usage_events`. A write that fails is reported as `unrecorded`. */
export function createPostgresUsageSink(db: Database): UsageSink {
  return {
    async record(event) {
      try {
        await appendUsageEvent(db, {
          id: event.id,
          endpoint_id: event.endpointId,
          ...(event.callerId === null ? {} : { caller_id: event.callerId }),
          outcome: event.outcome,
          shape: event.shape,
          price_credits: event.priceCredits,
          latency_ms: event.latencyMs,
          refreshed: event.refreshed,
        });
        return ok(undefined);
      } catch {
        // The adapter turns the driver's failure into the port's; usage must never break a call.
        return err({ code: "unrecorded" });
      }
    },
  };
}
