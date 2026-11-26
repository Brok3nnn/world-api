import { describe, expect, it } from "vitest";
import { RECIPE_EXAMPLE } from "./examples/recipe-example";
import { recipeDocumentSchema } from "./recipe";
import { RECIPE_LIMITS } from "./recipe-limits";

const STEP = { id: "out", use: "transform", expr: "1" };

function acceptsWith(overrides: Record<string, unknown>): boolean {
  return recipeDocumentSchema.safeParse({ ...RECIPE_EXAMPLE, ...overrides }).success;
}

function stepsOf(count: number): unknown[] {
  return Array.from({ length: count }, (_, index) => ({ ...STEP, id: `step_${index}` }));
}

describe("RECIPE_LIMITS", () => {
  it("states the structural limits of the recipe documentation", () => {
    expect(RECIPE_LIMITS).toEqual({ steps: 12, fetches: 4, documentBytes: 32_768 });
  });
});

describe("recipeDocumentSchema", () => {
  it("accepts the example of the recipe documentation", () => {
    expect(recipeDocumentSchema.parse(RECIPE_EXAMPLE)).toEqual(RECIPE_EXAMPLE);
  });

  it("accepts a recipe without as_of", () => {
    expect(acceptsWith({ as_of: undefined })).toBe(true);
  });

  it("accepts a recipe of one step and one of twelve", () => {
    expect(acceptsWith({ steps: stepsOf(1) })).toBe(true);
    expect(acceptsWith({ steps: stepsOf(12) })).toBe(true);
  });

  it.each([
    ["a version the engine does not know", { version: 2 }],
    ["no steps", { steps: [] }],
    ["thirteen steps", { steps: stepsOf(13) }],
    ["a step that is not valid", { steps: [{ id: "out", use: "transform" }] }],
    ["an output that is not a step id", { output: "The Result" }],
    ["an empty as_of expression", { as_of: "" }],
    ["a field that is not part of a recipe", { schedule: "5m" }],
  ])("rejects %s", (_rule, overrides) => {
    expect(acceptsWith(overrides)).toBe(false);
  });

  it.each(["version", "steps", "output"] as const)("rejects a recipe without %s", (field) => {
    const { [field]: _removed, ...rest } = RECIPE_EXAMPLE;

    expect(recipeDocumentSchema.safeParse(rest).success).toBe(false);
  });
});
