import type { BuildStage } from "@repo/contracts/build/build-stage";
import type { BuildStatus } from "@repo/contracts/build/build-status";
import type { BuildId } from "@repo/core/ids/id";
import { eq } from "drizzle-orm";
import type { Database } from "../../client/database";
import { accounts } from "../../schema/accounts-table";
import { builds } from "../../schema/builds-table";
import { endpoints } from "../../schema/endpoints-table";

/**
 * Where a build is. The endpoint is given as its path; the caller turns it into the permanent
 * URL, which depends on where the API is served.
 */
export interface StoredBuildStatus {
  readonly id: BuildId;
  readonly status: BuildStatus;
  readonly stage: BuildStage | null;
  readonly progress: number;
  readonly endpoint: { readonly owner: string; readonly slug: string } | null;
  readonly reason: string | null;
}

/** The status of a build, or `undefined` when there is no such build. */
export async function readBuildStatus(
  db: Database,
  buildId: BuildId,
): Promise<StoredBuildStatus | undefined> {
  const [row] = await db
    .select({ build: builds, owner: accounts.handle, slug: endpoints.slug })
    .from(builds)
    .leftJoin(endpoints, eq(endpoints.id, builds.endpoint_id))
    .leftJoin(accounts, eq(accounts.id, endpoints.owner_id))
    .where(eq(builds.id, buildId));
  if (row === undefined) {
    return undefined;
  }
  const { build, owner, slug } = row;
  return {
    id: buildId,
    status: build.status,
    stage: build.stage,
    progress: build.progress,
    endpoint: owner === null || slug === null ? null : { owner, slug },
    reason: build.reason,
  };
}
