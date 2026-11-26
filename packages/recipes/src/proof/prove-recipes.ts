import { err } from "@repo/core/result";
import type { Clock } from "@repo/core/time/clock";
import { createPolicedFetch, type PolicedFetchDeps } from "../egress/create-policed-fetch";
import { type RunOutcome, runRecipe } from "../engine/run-recipe";
import { applyFirewall, type FirewallViolation } from "../firewall/apply-firewall";
import type { GoldenRecipe } from "../golden/golden-recipe";
import type { EndpointReader } from "../ports/endpoint-reader";
import { STEP_EXECUTORS } from "../steps/step-executors";

/** The exit codes of the proof: each kind of ending has its own. */
export const PROOF_EXIT = { pass: 0, failed: 1, missingConfiguration: 2, unreachable: 3 } as const;

/** What one recipe did against its live sources, and how it ended. */
export interface RecipeEvidence {
  readonly golden: GoldenRecipe;
  readonly outcome: RunOutcome;
  readonly violations: readonly FirewallViolation[];
  readonly verdict: "pass" | "failed" | "unreachable";
  /** Why it did not pass, in one sentence; `null` when it passed. */
  readonly reason: string | null;
}

/** The proof runs recipes that fetch; none reads another endpoint. */
const NO_ENDPOINTS: EndpointReader = async () => err({ code: "endpoint_unavailable" });

/** The live egress of the proof; the allowed hosts come from each recipe. */
export type ProofEgress = Omit<PolicedFetchDeps, "allowedHosts">;

async function prove(
  golden: GoldenRecipe,
  egress: ProofEgress,
  clock: Clock,
): Promise<RecipeEvidence> {
  const deps = {
    fetch: createPolicedFetch({ ...egress, allowedHosts: golden.hosts }),
    readEndpoint: NO_ENDPOINTS,
    clock,
  };
  const outcome = await runRecipe(golden.recipe, deps, STEP_EXECUTORS);
  const evidence = { golden, outcome, violations: [] };
  if (!outcome.result.ok) {
    const { code, step } = outcome.result.error;
    const failed = golden.recipe.steps.find((candidate) => candidate.id === step);
    const host = failed?.use === "http.get" ? new URL(failed.url).hostname : undefined;
    if (host !== undefined && (code === "fetch_failed" || code === "fetch_timeout")) {
      return {
        ...evidence,
        verdict: "unreachable",
        reason: `${host} is unreachable (${code} at step ${step}).`,
      };
    }
    return {
      ...evidence,
      verdict: "failed",
      reason: `The run failed with ${code} at step ${step}.`,
    };
  }
  const checked = applyFirewall(outcome.result.value.data, golden.outputSpec);
  return checked.ok
    ? { ...evidence, verdict: "pass", reason: null }
    : {
        ...evidence,
        violations: checked.error,
        verdict: "failed",
        reason: "The value broke its output spec.",
      };
}

/**
 * Runs each recipe against its live sources through the egress policy and checks its value
 * with the output firewall. It stops at the first recipe that does not pass.
 */
export async function proveRecipes(
  goldens: readonly GoldenRecipe[],
  egress: ProofEgress,
  clock: Clock,
): Promise<readonly RecipeEvidence[]> {
  const evidences: RecipeEvidence[] = [];
  for (const golden of goldens) {
    const evidence = await prove(golden, egress, clock);
    evidences.push(evidence);
    if (evidence.verdict !== "pass") {
      break;
    }
  }
  return evidences;
}

/** The exit code of a proof run: the ending of its first recipe that did not pass. */
export function exitCodeOf(evidences: readonly RecipeEvidence[], expected: number): number {
  const stopped = evidences.find((evidence) => evidence.verdict !== "pass");
  if (stopped !== undefined) {
    return PROOF_EXIT[stopped.verdict];
  }
  return evidences.length === expected ? PROOF_EXIT.pass : PROOF_EXIT.failed;
}
