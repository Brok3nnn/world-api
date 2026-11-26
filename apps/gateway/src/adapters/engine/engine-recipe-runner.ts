import type { Clock } from "@repo/core/time/clock";
import {
  createPolicedFetch,
  type PolicedFetchDeps,
} from "@repo/recipes/egress/create-policed-fetch";
import { runRecipe } from "@repo/recipes/engine/run-recipe";
import { STEP_EXECUTORS } from "@repo/recipes/steps/step-executors";
import type { RecipeRunner } from "../../ports/recipe-runner";
import type { SourceRateLimiter } from "../../ports/source-rate-limiter";

/** What every run shares; the allowed hosts differ per run. */
export type EngineRecipeRunnerDeps = Omit<PolicedFetchDeps, "allowedHosts" | "rateLimit"> & {
  readonly clock: Clock;
  readonly limiter: SourceRateLimiter;
};

/**
 * The `RecipeRunner` over `packages/recipes`: every fetch through the egress policy, only to the
 * hosts of the run's sources, and only while their source is within its rate limit.
 */
export function createEngineRecipeRunner(deps: EngineRecipeRunnerDeps): RecipeRunner {
  const { clock, limiter, ...egress } = deps;
  return {
    async run({ recipe, sources, readEndpoint }) {
      const fetch = createPolicedFetch({
        ...egress,
        allowedHosts: sources.flatMap((source) => source.hosts),
        rateLimit: (host) => {
          const source = sources.find((candidate) => candidate.hosts.includes(host));
          return source !== undefined && limiter.allow(source.id, source.rateLimitPerMin);
        },
      });
      const outcome = await runRecipe(recipe, { fetch, readEndpoint, clock }, STEP_EXECUTORS);
      return outcome.result;
    },
  };
}
