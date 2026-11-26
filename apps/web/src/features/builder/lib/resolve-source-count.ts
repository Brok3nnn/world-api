import type { SourceMix } from "../constants";

/** Sources a build blends when the requester leaves the choice to the builder. */
const AUTO_SOURCE_COUNT = 2;

export function resolveSourceCount(sources: SourceMix): number {
  return sources === "auto" ? AUTO_SOURCE_COUNT : Number(sources);
}
