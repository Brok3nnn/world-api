import type { Recipe } from "@repo/contracts/recipe/recipe-schema";

/** A call costs this many credits for every source its recipe reads. */
export const CREDITS_PER_SOURCE_READ = 1;

/**
 * The credits a call of an endpoint costs, from what its recipe reads: one per fetch and one
 * per read of another endpoint, and never less than one. The surcharge for a value a model
 * produces at call time is reserved for the step kind that introduces it.
 */
export function callPriceCredits(recipe: Recipe): number {
  const reads = recipe.steps.filter(
    (step) => step.use === "http.get" || step.use === "endpoint.read",
  ).length;
  return Math.max(1, reads) * CREDITS_PER_SOURCE_READ;
}
