import { ok, type Result } from "@repo/core/result";
import type { RunFailure } from "@repo/recipes/engine/run-failure";
import type { RunValue } from "@repo/recipes/engine/run-recipe";
import type { RecipeRun, RecipeRunner } from "../recipe-runner";

/** A `RecipeRunner` that answers every run with one prepared outcome and records the runs. */
export interface FakeRecipeRunner extends RecipeRunner {
  readonly runs: readonly RecipeRun[];
}

const NEW_VALUE = ok({ data: { temperature_c: 5.1 }, asOf: new Date("2026-11-22T09:59:00.000Z") });

export function createFakeRecipeRunner(
  outcome: Result<RunValue, RunFailure> = NEW_VALUE,
): FakeRecipeRunner {
  const runs: RecipeRun[] = [];
  return {
    runs,
    run: async (run) => {
      runs.push(run);
      return outcome;
    },
  };
}
