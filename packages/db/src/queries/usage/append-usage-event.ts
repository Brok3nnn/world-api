import type { AccountId, EndpointId, UsageEventId } from "@repo/core/ids/id";
import type { Database } from "../../client/database";
import { usageEvents } from "../../schema/usage-events-table";

/** How a call ended: `served`, or the error code it was answered with. */
export type UsageOutcome = (typeof usageEvents.$inferInsert)["outcome"];

/** Records one call. Usage rows are never changed; statistics are derived from them. */
export async function appendUsageEvent(
  db: Database,
  event: {
    readonly id: UsageEventId;
    readonly endpoint_id: EndpointId;
    /** The account that called; absent for an anonymous call. */
    readonly caller_id?: AccountId;
    readonly outcome: UsageOutcome;
    readonly shape: (typeof usageEvents.$inferInsert)["shape"];
    readonly price_credits: number;
    readonly latency_ms: number;
    readonly refreshed: boolean;
  },
): Promise<void> {
  await db.insert(usageEvents).values(event);
}
