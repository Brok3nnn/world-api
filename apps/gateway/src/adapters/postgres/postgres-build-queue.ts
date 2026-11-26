import type { Database } from "@repo/db/client/database";
import { readBuildStatus } from "@repo/db/queries/build/read-build-status";
import type { BuildQueue } from "../../ports/build-queue";

/** The `BuildQueue` over the `builds` table. */
export function createPostgresBuildQueue(db: Database): BuildQueue {
  return {
    status: async (buildId) => (await readBuildStatus(db, buildId)) ?? null,
  };
}
