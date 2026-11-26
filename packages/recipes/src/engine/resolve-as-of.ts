import { instantSchema } from "@repo/contracts/api/instant";
import type { Recipe } from "@repo/contracts/recipe/recipe-schema";
import { err, ok, type Result } from "@repo/core/result";
import type { Clock } from "@repo/core/time/clock";
import { evaluateExpression } from "../expression/evaluate-expression";
import type { JsonValue } from "./json-value";
import type { StepFailure } from "./run-failure";

/** What a failing `as_of` expression is reported as, in place of a step id. */
export const AS_OF = "as_of";

interface Observed {
  readonly clock: Clock;
  /** When the last `http.get` step of the run finished, if it had one. */
  readonly lastFetchAt: Date | undefined;
}

/**
 * When the value was observed. The recipe's `as_of` expression decides when it has one, and must
 * yield a UTC instant such as `2026-11-22T10:00:00Z`. Otherwise it is the time of the last
 * fetch, or, for a recipe that fetches nothing, the end of the run.
 */
export async function resolveAsOf(
  recipe: Recipe,
  results: ReadonlyMap<string, JsonValue>,
  observed: Observed,
): Promise<Result<Date, StepFailure>> {
  if (recipe.as_of === undefined) {
    return ok(observed.lastFetchAt ?? observed.clock.now());
  }
  const value = await evaluateExpression(recipe.as_of, Object.fromEntries(results), observed.clock);
  if (!value.ok) {
    return value;
  }
  const instant = instantSchema.safeParse(value.value);
  return instant.success ? ok(new Date(instant.data)) : err({ code: "expression_failed" });
}
