import type { EndpointStatus } from "@repo/contracts/endpoint/endpoint-status";
import type { EndpointId } from "@repo/core/ids/id";
import { canTransition } from "@repo/core/status/can-transition";
import { ENDPOINT_TRANSITIONS } from "@repo/core/status/endpoint-transitions";
import { and, eq, sql } from "drizzle-orm";
import type { Database } from "../../client/database";
import { endpoints } from "../../schema/endpoints-table";

/**
 * Moves an endpoint from one status to another, only if it still has the first: two instances
 * that both see a third failure move it once. A move the transition table does not allow is a
 * defect. Returns whether the endpoint moved.
 */
export async function moveEndpointStatus(
  db: Database,
  move: {
    readonly endpoint_id: EndpointId;
    readonly from: EndpointStatus;
    readonly to: EndpointStatus;
  },
): Promise<boolean> {
  if (!canTransition(ENDPOINT_TRANSITIONS, move.from, move.to)) {
    throw new Error(`An endpoint cannot move from ${move.from} to ${move.to}.`);
  }
  const moved = await db
    .update(endpoints)
    .set({ status: move.to, updated_at: sql`now()` })
    .where(and(eq(endpoints.id, move.endpoint_id), eq(endpoints.status, move.from)))
    .returning({ id: endpoints.id });
  return moved.length === 1;
}
