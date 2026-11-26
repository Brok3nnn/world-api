import type { BuildStatus } from "@repo/contracts/build/build-status";

/**
 * The statuses a build may move to from each status. A build runs once and ends in exactly one
 * of three ways; an ended build never changes again.
 */
export const BUILD_TRANSITIONS = {
  queued: ["running"],
  running: ["succeeded", "failed", "rejected"],
  succeeded: [],
  failed: [],
  rejected: [],
} as const satisfies Record<BuildStatus, readonly BuildStatus[]>;
