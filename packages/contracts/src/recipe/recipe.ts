import { z } from "zod";
import { RECIPE_LIMITS } from "./recipe-limits";
import { expressionSchema, recipeStepSchema, stepIdSchema } from "./recipe-step";

/**
 * A recipe document: the ordered steps that produce an endpoint's value, the step whose result
 * is that value, and optionally when the value was observed. Rules that span several steps are
 * added by the recipe validation that builds on this schema.
 */
export const recipeDocumentSchema = z.strictObject({
  version: z.literal(1),
  steps: z.array(recipeStepSchema).min(1).max(RECIPE_LIMITS.steps),
  /** The id of the step whose result is the value. */
  output: stepIdSchema,
  /** Expression for the instant the value was observed; the fetch time when absent. */
  as_of: expressionSchema.optional(),
});

export type RecipeDocument = z.infer<typeof recipeDocumentSchema>;
