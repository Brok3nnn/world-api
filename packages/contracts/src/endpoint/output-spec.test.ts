import { describe, expect, it } from "vitest";
import { OUTPUT_SPEC_EXAMPLE } from "./examples/output-spec-example";
import { outputSpecSchema } from "./output-spec";

function issuesOf(overrides: Record<string, unknown>): string[] {
  const parsed = outputSpecSchema.safeParse({ ...OUTPUT_SPEC_EXAMPLE, ...overrides });
  return (parsed.error?.issues ?? []).map((issue) => `${issue.path.join(".")}: ${issue.message}`);
}

describe("outputSpecSchema", () => {
  it("accepts the example of the recipe documentation", () => {
    expect(outputSpecSchema.parse(OUTPUT_SPEC_EXAMPLE)).toEqual(OUTPUT_SPEC_EXAMPLE);
  });

  it("accepts a spec that is only a schema", () => {
    expect(outputSpecSchema.safeParse({ schema: OUTPUT_SPEC_EXAMPLE.schema }).success).toBe(true);
  });

  it("accepts a sentence without any field", () => {
    expect(issuesOf({ sentence: "It is raining." })).toEqual([]);
  });

  it("rejects a spec without a schema", () => {
    expect(outputSpecSchema.safeParse({ primary: "temperature_c" }).success).toBe(false);
  });

  it("rejects a schema whose root is not an object", () => {
    expect(issuesOf({ schema: { type: "number" } })).not.toEqual([]);
  });

  it("names a primary field that is not a property", () => {
    expect(issuesOf({ primary: "humidity" })).toEqual([
      'primary: primary names "humidity", which is not a property of the schema.',
    ]);
  });

  it("names every sentence field that is not a property", () => {
    expect(issuesOf({ sentence: "{temperature_c} °C, {wind} m/s, {gusts} m/s" })).toEqual([
      "sentence: The sentence uses {wind}, which is not a property of the schema.",
      "sentence: The sentence uses {gusts}, which is not a property of the schema.",
    ]);
  });

  it("rejects empty braces in a sentence", () => {
    expect(issuesOf({ sentence: "It is {} °C." })).toHaveLength(1);
  });

  it.each([
    ["an empty unit", { unit: "" }],
    ["a unit of 17 characters", { unit: "a".repeat(17) }],
    ["an empty sentence", { sentence: "" }],
    ["a sentence of 201 characters", { sentence: "a".repeat(201) }],
    ["a field that is not part of a spec", { examples: [] }],
  ])("rejects %s", (_rule, overrides) => {
    expect(issuesOf(overrides)).not.toEqual([]);
  });

  it("does not accept a field name inherited from every object as a property", () => {
    expect(issuesOf({ primary: "constructor" })).toHaveLength(1);
  });
});
