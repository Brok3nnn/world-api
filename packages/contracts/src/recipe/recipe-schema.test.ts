import { describe, expect, it } from "vitest";
import { INVALID_RECIPE_EXAMPLES } from "./examples/invalid-recipes";
import { VALID_RECIPE_EXAMPLES } from "./examples/valid-recipes";
import { recipeDocumentSchema } from "./recipe";
import { RECIPE_LIMITS } from "./recipe-limits";
import { recipeSchema } from "./recipe-schema";

const FETCH = { use: "http.get", url: "https://data.example.org/v1", expect: "json" };

/** The issues of a recipe as "path: message". */
function issuesOf(recipe: unknown): string[] {
  return (recipeSchema.safeParse(recipe).error?.issues ?? []).map(
    (issue) => `${issue.path.join(".")}: ${issue.message}`,
  );
}

describe("recipeSchema", () => {
  it.each(
    Object.entries(VALID_RECIPE_EXAMPLES),
  )("accepts the valid example %s", (_name, recipe) => {
    expect(recipeSchema.parse(recipe)).toEqual(recipe);
  });

  it.each(
    Object.entries(INVALID_RECIPE_EXAMPLES),
  )("rejects the invalid example %s although its shape is valid", (_name, recipe) => {
    expect(recipeDocumentSchema.safeParse(recipe).success).toBe(true);
    expect(recipeSchema.safeParse(recipe).success).toBe(false);
  });

  it("names a step id that appears more than once", () => {
    expect(issuesOf(INVALID_RECIPE_EXAMPLES.duplicate_id)).toEqual([
      'steps.1.id: Step "out" appears more than once.',
    ]);
  });

  it("names a step that reads a later step", () => {
    expect(issuesOf(INVALID_RECIPE_EXAMPLES.forward_reference)).toEqual([
      'steps.0.from: Step "cell" reads "page", which is not an earlier step.',
    ]);
  });

  it("names a step that reads itself", () => {
    const steps = [{ id: "cell", use: "text.match", from: "cell", pattern: "a" }];

    expect(issuesOf({ version: 1, steps, output: "cell" })).toEqual([
      'steps.0.from: Step "cell" reads "cell", which is not an earlier step.',
    ]);
  });

  it("names an output that is not a step", () => {
    expect(issuesOf(INVALID_RECIPE_EXAMPLES.unknown_output)).toEqual([
      'output: output names "result", which is not a step.',
    ]);
  });

  it("accepts exactly the allowed number of fetches", () => {
    const steps = ["a", "b", "c", "d"].map((id) => ({ id, ...FETCH }));

    expect(steps).toHaveLength(RECIPE_LIMITS.fetches);
    expect(issuesOf({ version: 1, steps, output: "a" })).toEqual([]);
  });

  it("states the number of fetches when there are too many", () => {
    expect(issuesOf(INVALID_RECIPE_EXAMPLES.too_many_fetches)).toEqual([
      "steps: The recipe has 5 http.get steps; the limit is 4.",
    ]);
  });

  it("rejects a document larger than the size limit in bytes", () => {
    // Each expression is within its character limit, but its characters take three bytes each.
    const steps = Array.from({ length: 12 }, (_, index) => ({
      id: `step_${index}`,
      use: "transform",
      expr: "€".repeat(2000),
    }));

    expect(issuesOf({ version: 1, steps, output: "step_0" })).toEqual([
      expect.stringMatching(/^: The recipe is \d+ bytes; the limit is 32768\.$/),
    ]);
  });

  it("reports every broken rule at once", () => {
    const steps = [
      { id: "x", use: "html.select", from: "missing", selector: "td" },
      { id: "x", use: "transform", expr: "1" },
    ];

    expect(issuesOf({ version: 1, steps, output: "y" })).toHaveLength(3);
  });

  it("still rejects a document with an invalid shape", () => {
    expect(recipeSchema.safeParse({ version: 2, steps: [], output: "x" }).success).toBe(false);
  });
});
