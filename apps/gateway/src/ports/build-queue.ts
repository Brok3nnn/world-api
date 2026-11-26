import type { BuildStage } from "@repo/contracts/build/build-stage";
import type { BuildStatus } from "@repo/contracts/build/build-status";
import type { BuildId } from "@repo/core/ids/id";

/** Where a build is; a finished build names its endpoint by owner and slug. */
export interface BuildState {
  readonly id: BuildId;
  readonly status: BuildStatus;
  readonly stage: BuildStage | null;
  readonly progress: number;
  readonly endpoint: { readonly owner: string; readonly slug: string } | null;
  readonly reason: string | null;
}

/** The builds the API has queued; for now, only how each one stands. */
export interface BuildQueue {
  status(buildId: BuildId): Promise<BuildState | null>;
}
