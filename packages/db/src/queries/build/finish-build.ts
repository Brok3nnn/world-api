import type { BuildId, EndpointId } from "@repo/core/ids/id";
import { err, ok, type Result } from "@repo/core/result";
import { sql } from "drizzle-orm";
import type { Database } from "../../client/database";
import { builds } from "../../schema/builds-table";
import { whereBuildCanMoveTo } from "./build-transition";

/** How a build ended: with an endpoint, or with one sentence for the requester. */
export type BuildOutcome =
  | { readonly status: "succeeded"; readonly endpoint_id: EndpointId }
  | { readonly status: "failed" | "rejected"; readonly reason: string };

/**
 * Ends a build, only along the transitions the core allows: a build that is not running cannot
 * end, and an ended build never changes again. The lock is released.
 */
export async function finishBuild(
  db: Database,
  finish: { readonly build_id: BuildId; readonly outcome: BuildOutcome },
): Promise<Result<void, { readonly code: "transition_refused" }>> {
  const { outcome } = finish;
  const ended = await db
    .update(builds)
    .set({
      status: outcome.status,
      endpoint_id: outcome.status === "succeeded" ? outcome.endpoint_id : null,
      reason: outcome.status === "succeeded" ? null : outcome.reason,
      progress: 1,
      locked_until: null,
      updated_at: sql`now()`,
    })
    .where(whereBuildCanMoveTo(finish.build_id, outcome.status))
    .returning({ id: builds.id });
  return ended.length === 0 ? err({ code: "transition_refused" }) : ok(undefined);
}
