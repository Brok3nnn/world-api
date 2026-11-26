import { type BuildRequest, buildRequestSchema } from "@repo/contracts/build/build-request";
import type { BuildStage } from "@repo/contracts/build/build-stage";
import type { AccountId, BuildId } from "@repo/core/ids/id";
import { and, asc, eq, inArray, lt, or, type SQL, sql } from "drizzle-orm";
import type { Database } from "../../client/database";
import { builds } from "../../schema/builds-table";
import { parseStored } from "../parse-stored";
import { storedId } from "../stored-id";

/** A build a runner now holds until `locked_until`. */
export interface ClaimedBuild {
  readonly id: BuildId;
  readonly requester_id: AccountId;
  readonly request: BuildRequest;
  /** The last stage that started, or `null` for a build that has not started. */
  readonly stage: BuildStage | null;
  readonly attempt: number;
  readonly locked_until: Date;
}

export interface ClaimWindow {
  /** The current time, from the caller's clock. */
  readonly now: Date;
  /** Until when the runner holds the build; another runner may claim it afterwards. */
  readonly lock_until: Date;
}

/** Queued builds, and running builds whose runner let its lock expire. */
function claimable(now: Date): SQL | undefined {
  return or(
    eq(builds.status, "queued"),
    and(eq(builds.status, "running"), lt(builds.locked_until, now)),
  );
}

async function claimWhere(db: Database, target: SQL | undefined, window: ClaimWindow) {
  const [row] = await db
    .update(builds)
    .set({ status: "running", locked_until: window.lock_until, updated_at: sql`now()` })
    .where(and(target, claimable(window.now)))
    .returning();
  if (row === undefined) {
    return undefined;
  }
  return {
    id: storedId("build", row.id),
    requester_id: storedId("account", row.requester_id),
    request: parseStored(buildRequestSchema, row.request, "build request"),
    stage: row.stage,
    attempt: row.attempt,
    locked_until: window.lock_until,
  } satisfies ClaimedBuild;
}

/**
 * Claims one build for a runner. It succeeds only if the build is queued, or running with an
 * expired lock; one statement decides, so of two runners claiming at once exactly one wins.
 */
export function claimBuild(
  db: Database,
  claim: ClaimWindow & { readonly build_id: BuildId },
): Promise<ClaimedBuild | undefined> {
  return claimWhere(db, eq(builds.id, claim.build_id), claim);
}

/** Claims the oldest claimable build, skipping builds another runner is claiming right now. */
export function claimNextBuild(
  db: Database,
  window: ClaimWindow,
): Promise<ClaimedBuild | undefined> {
  const oldest = db
    .select({ id: builds.id })
    .from(builds)
    .where(claimable(window.now))
    .orderBy(asc(builds.created_at), asc(builds.id))
    .limit(1)
    .for("update", { skipLocked: true });
  return claimWhere(db, inArray(builds.id, oldest), window);
}
