import { describe, expect, it } from "vitest";
import { buildSpecSchema } from "./build-spec";
import { BUILD_SPEC_EXAMPLE } from "./examples/build-examples";

const FIELD = BUILD_SPEC_EXAMPLE.fields[0];

function acceptsWith(overrides: Record<string, unknown>): boolean {
  return buildSpecSchema.safeParse({ ...BUILD_SPEC_EXAMPLE, ...overrides }).success;
}

function acceptsField(overrides: Record<string, unknown>): boolean {
  return acceptsWith({ fields: [{ ...FIELD, ...overrides }] });
}

describe("buildSpecSchema", () => {
  it("accepts the example spec", () => {
    expect(buildSpecSchema.parse(BUILD_SPEC_EXAMPLE)).toEqual(BUILD_SPEC_EXAMPLE);
  });

  it("accepts a text field without unit or range", () => {
    const field = { name: "headline", type: "string", description: "The top headline." };

    expect(acceptsWith({ fields: [field] })).toBe(true);
  });

  it.each([
    ["an empty subject", { subject: "" }],
    ["a subject of 121 characters", { subject: "a".repeat(121) }],
    ["no fields", { fields: [] }],
    ["seventeen fields", { fields: Array.from({ length: 17 }, () => FIELD) }],
    ["an unresolved number of sources", { sources_count: undefined }],
    ["an unresolved shape", { shape: undefined }],
    ["an unresolved freshness", { freshness: undefined }],
    ["a field that is not part of a spec", { notes: "x" }],
  ])("rejects %s", (_rule, overrides) => {
    expect(acceptsWith(overrides)).toBe(false);
  });

  it.each([
    ["a name that is not snake_case", { name: "Free Spots" }],
    ["a type outside number, string and boolean", { type: "date" }],
    ["no description", { description: undefined }],
    ["a description of 201 characters", { description: "a".repeat(201) }],
    ["an empty unit", { unit: "" }],
    ["a range that is not numeric", { minimum: "0" }],
    ["a key that is not part of a field", { example: 12 }],
  ])("rejects a field with %s", (_rule, overrides) => {
    expect(acceptsField(overrides)).toBe(false);
  });
});
