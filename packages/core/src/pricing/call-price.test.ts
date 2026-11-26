import { VALID_RECIPE_EXAMPLES } from "@repo/contracts/recipe/examples/valid-recipes";
import type { Recipe } from "@repo/contracts/recipe/recipe-schema";
import { describe, expect, it } from "vitest";
import { CREDITS_PER_SOURCE_READ, callPriceCredits } from "./call-price";

function recipeOf(steps: Recipe["steps"]): Recipe {
  return { version: 1, steps, output: steps[0]?.id ?? "out" };
}

describe("callPriceCredits", () => {
  it("charges one credit per source read", () => {
    expect(CREDITS_PER_SOURCE_READ).toBe(1);
  });

  it("is one credit for a recipe that fetches one page", () => {
    expect(callPriceCredits(VALID_RECIPE_EXAMPLES.page)).toBe(1);
  });

  it("counts a fetch and a read of another endpoint as two", () => {
    expect(callPriceCredits(VALID_RECIPE_EXAMPLES.combined)).toBe(2);
  });

  it("charges a mix one credit per endpoint it reads", () => {
    const mix = recipeOf([
      { id: "weather", use: "endpoint.read", ref: "@core/weather-now-vienna" },
      { id: "rate", use: "endpoint.read", ref: "@core/eur-huf" },
      { id: "news", use: "endpoint.read", ref: "@core/top-story" },
    ]);

    expect(callPriceCredits(mix)).toBe(3);
  });

  it("does not charge for steps that only select, match or transform", () => {
    const { steps } = VALID_RECIPE_EXAMPLES.page;

    expect(steps).toHaveLength(4);
    expect(callPriceCredits(VALID_RECIPE_EXAMPLES.page)).toBe(1);
  });

  it("is never less than one credit", () => {
    expect(callPriceCredits(recipeOf([{ id: "out", use: "transform", expr: "1" }]))).toBe(1);
  });
});
