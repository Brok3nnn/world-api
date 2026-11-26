import type { z } from "zod";
import { recipeDocumentSchema } from "./recipe";
import { recipeProblems } from "./recipe-problems";

/**
 * A recipe that is safe to store and run: the document shape plus every rule that spans steps.
 * This is the schema to parse a recipe with at every boundary.
 */
export const recipeSchema = recipeDocumentSchema.superRefine((recipe, context) => {
  for (const problem of recipeProblems(recipe)) {
    context.addIssue({ code: "custom", path: [...problem.path], message: problem.message });
  }
});

export type Recipe = z.infer<typeof recipeSchema>;
