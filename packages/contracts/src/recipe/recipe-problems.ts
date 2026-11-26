import type { RecipeDocument } from "./recipe";
import { RECIPE_LIMITS } from "./recipe-limits";

/** One broken rule of a recipe: where it is, and a sentence that names the step. */
export interface RecipeProblem {
  readonly path: readonly (string | number)[];
  readonly message: string;
}

function duplicateIds(recipe: RecipeDocument): RecipeProblem[] {
  return recipe.steps.flatMap((step, index) =>
    recipe.steps.findIndex((other) => other.id === step.id) < index
      ? [{ path: ["steps", index, "id"], message: `Step "${step.id}" appears more than once.` }]
      : [],
  );
}

function forwardReferences(recipe: RecipeDocument): RecipeProblem[] {
  return recipe.steps.flatMap((step, index) => {
    if (!("from" in step)) {
      return [];
    }
    const earlier = recipe.steps.slice(0, index).some((other) => other.id === step.from);
    return earlier
      ? []
      : [
          {
            path: ["steps", index, "from"],
            message: `Step "${step.id}" reads "${step.from}", which is not an earlier step.`,
          },
        ];
  });
}

function unknownOutput(recipe: RecipeDocument): RecipeProblem[] {
  return recipe.steps.some((step) => step.id === recipe.output)
    ? []
    : [{ path: ["output"], message: `output names "${recipe.output}", which is not a step.` }];
}

function tooManyFetches(recipe: RecipeDocument): RecipeProblem[] {
  const fetches = recipe.steps.filter((step) => step.use === "http.get").length;
  return fetches > RECIPE_LIMITS.fetches
    ? [
        {
          path: ["steps"],
          message: `The recipe has ${fetches} http.get steps; the limit is ${RECIPE_LIMITS.fetches}.`,
        },
      ]
    : [];
}

function tooLarge(recipe: RecipeDocument): RecipeProblem[] {
  const bytes = new TextEncoder().encode(JSON.stringify(recipe)).length;
  return bytes > RECIPE_LIMITS.documentBytes
    ? [
        {
          path: [],
          message: `The recipe is ${bytes} bytes; the limit is ${RECIPE_LIMITS.documentBytes}.`,
        },
      ]
    : [];
}

/** Every rule a recipe breaks that no single step can show: the rules that span steps. */
export function recipeProblems(recipe: RecipeDocument): RecipeProblem[] {
  return [
    ...duplicateIds(recipe),
    ...forwardReferences(recipe),
    ...unknownOutput(recipe),
    ...tooManyFetches(recipe),
    ...tooLarge(recipe),
  ];
}
