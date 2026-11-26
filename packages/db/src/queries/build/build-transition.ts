import type { BuildStatus } from "@repo/contracts/build/build-status";
import { BUILD_TRANSITIONS } from "@repo/core/status/build-transitions";
import { canTransition } from "@repo/core/status/can-transition";
import { and, eq, inArray, type SQL } from "drizzle-orm";
import { builds } from "../../schema/builds-table";

/** The statuses a build may be in to move to `next`, by the transition table of the core. */
export function statusesBefore(next: BuildStatus): BuildStatus[] {
  // Safe: Object.keys of this constant table returns exactly its statuses.
  const statuses = Object.keys(BUILD_TRANSITIONS) as BuildStatus[];
  return statuses.filter((status) => canTransition(BUILD_TRANSITIONS, status, next));
}

/** The build with this id, only while it is in a status from which `next` is allowed. */
export function whereBuildCanMoveTo(buildId: string, next: BuildStatus): SQL | undefined {
  return and(eq(builds.id, buildId), inArray(builds.status, statusesBefore(next)));
}
