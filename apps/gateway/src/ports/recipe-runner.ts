import type { Recipe } from "@repo/contracts/recipe/recipe-schema";
import type { Result } from "@repo/core/result";
import type { RunFailure } from "@repo/recipes/engine/run-failure";
import type { RunValue } from "@repo/recipes/engine/run-recipe";
import type { EndpointReader } from "@repo/recipes/ports/endpoint-reader";
import type { ServedEndpoint } from "./endpoint-directory";

/** One run of an endpoint's recipe, and the usable sources it may read: their hosts only. */
export interface RecipeRun {
  readonly recipe: Recipe;
  readonly sources: ServedEndpoint["sources"];
  /** How the run reads other endpoints, for a mix: through the gateway's own pipeline. */
  readonly readEndpoint: EndpointReader;
}

/** Runs a recipe: its value and when it was observed, or the step that failed and why. */
export interface RecipeRunner {
  run(run: RecipeRun): Promise<Result<RunValue, RunFailure>>;
}
