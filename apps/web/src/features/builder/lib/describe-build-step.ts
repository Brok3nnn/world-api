import { REFRESH_INTERVALS, SHAPES } from "@/features/catalog/constants";
import { VISIBILITY_OPTIONS } from "../constants";
import type { BuildJob, BuildStepId } from "../types";
import { resolveSourceCount } from "./resolve-source-count";

const SANDBOX_RUNS = 14;

/** Short, request-specific outcome of a finished pipeline step, e.g. "2 sources found". */
export function describeBuildStep(step: BuildStepId, job: BuildJob): string {
  const sourceCount = resolveSourceCount(job.request.sources);

  switch (step) {
    case "source-search":
      return `${sourceCount} ${sourceCount === 1 ? "source" : "sources"} found`;
    case "legal-filter":
      return `${sourceCount} cleared, 0 blocked`;
    case "recipe":
      return "Runs without a model";
    case "sandbox":
      return `${SANDBOX_RUNS} of ${SANDBOX_RUNS} passed`;
    case "schema":
      return `${outputLabel(job)}, ${REFRESH_INTERVALS[job.request.refresh].label.toLowerCase()}`;
    case "publish":
      return `Live, ${VISIBILITY_OPTIONS[job.visibility].label.toLowerCase()}`;
  }
}

function outputLabel(job: BuildJob): string {
  if (job.request.shape === "custom") {
    return `${job.fields.length} ${job.fields.length === 1 ? "field" : "fields"}`;
  }
  return SHAPES[job.request.shape].label;
}
