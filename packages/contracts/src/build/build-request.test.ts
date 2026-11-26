import { describe, expect, it } from "vitest";
import { buildRequestSchema } from "./build-request";
import { BUILD_REQUEST_EXAMPLE } from "./examples/build-examples";

function acceptsWith(overrides: Record<string, unknown>): boolean {
  return buildRequestSchema.safeParse({ ...BUILD_REQUEST_EXAMPLE, ...overrides }).success;
}

describe("buildRequestSchema", () => {
  it("accepts the example request", () => {
    expect(buildRequestSchema.parse(BUILD_REQUEST_EXAMPLE)).toEqual(BUILD_REQUEST_EXAMPLE);
  });

  it("accepts a request that is only words, and trims them", () => {
    expect(buildRequestSchema.parse({ text: "  river level in Vienna " })).toEqual({
      text: "river level in Vienna",
    });
  });

  it("accepts every setting chosen explicitly", () => {
    expect(acceptsWith({ sources_count: 4, shape: "number", freshness: "1m" })).toBe(true);
  });

  it.each([
    ["words shorter than 3 characters", { text: "ab" }],
    ["only spaces", { text: "     " }],
    ["words longer than 500 characters", { text: "a".repeat(501) }],
    ["zero sources", { sources_count: 0 }],
    ["more sources than a recipe may fetch", { sources_count: 5 }],
    ["a fractional number of sources", { sources_count: 1.5 }],
    ["an unknown shape", { shape: "xml" }],
    ["an unknown freshness", { freshness: "30s" }],
    ["a field that is not part of a request", { owner: "core" }],
  ])("rejects %s", (_rule, overrides) => {
    expect(acceptsWith(overrides)).toBe(false);
  });

  it("rejects a request without words", () => {
    expect(buildRequestSchema.safeParse({ freshness: "15m" }).success).toBe(false);
  });
});
