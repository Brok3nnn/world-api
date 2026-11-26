import type { BuildStage } from "@repo/contracts/build/build-stage";
import type { BuildId } from "@repo/core/ids/id";
import { err, ok, type Result } from "@repo/core/result";
import { and, eq, sql } from "drizzle-orm";
import type { Database } from "../../client/database";
import { builds } from "../../schema/builds-table";

/** Records that a running build moved on: its stage, its progress and its draft attempts. */
export async function advanceBuild(
  db: Database,
  step: {
    readonly build_id: BuildId;
    readonly stage: BuildStage;
    /** From 0 at the start to 1 when finished. */
    readonly progress: number;
    readonly attempt?: number;
  },
): Promise<Result<void, { readonly code: "not_running" }>> {
  const advanced = await db
    .update(builds)
    .set({
      stage: step.stage,
      progress: step.progress,
      attempt: step.attempt,
      updated_at: sql`now()`,
    })
    .where(and(eq(builds.id, step.build_id), eq(builds.status, "running")))
    .returning({ id: builds.id });
  return advanced.length === 0 ? err({ code: "not_running" }) : ok(undefined);
}
