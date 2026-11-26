import { isUsableSource } from "@repo/core/sources/usable-source";
import type { ServedEndpoint } from "../ports/endpoint-directory";

/**
 * The sources a run of the endpoint may read, and so the only hosts it may fetch from. A `red`
 * source, or one whose terms were last checked 90 days ago or more, is left out.
 */
export function usableSources(
  sources: ServedEndpoint["sources"],
  now: Date,
): ServedEndpoint["sources"] {
  return sources.filter((source) => isUsableSource(source, now));
}
