import type { BuildQueue, BuildState } from "../../ports/build-queue";

/** A `BuildQueue` over a fixed list of builds, for tests and local runs. */
export function createMemoryBuildQueue(builds: readonly BuildState[]): BuildQueue {
  return {
    status: async (buildId) => builds.find((build) => build.id === buildId) ?? null,
  };
}
