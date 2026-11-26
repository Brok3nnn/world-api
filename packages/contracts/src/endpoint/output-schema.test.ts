import { describe, expect, it } from "vitest";
import { outputObjectNodeSchema, outputSchemaNodeSchema } from "./output-schema";

function objectOf(properties: Record<string, unknown>, extra: Record<string, unknown> = {}) {
  return { type: "object", properties, additionalProperties: false, ...extra };
}

/** The first issue as "path: message", the way a builder would report it. */
function firstIssue(input: unknown): string {
  const issue = outputObjectNodeSchema.safeParse(input).error?.issues[0];
  return `${issue?.path.join(".")}: ${issue?.message}`;
}

describe("outputSchemaNodeSchema", () => {
  it.each([
    ["a string", { type: "string" }],
    ["a string with a closed list and a length", { type: "string", enum: ["a"], maxLength: 8 }],
    ["a number with a range", { type: "number", minimum: 0, maximum: 500 }],
    ["a boolean", { type: "boolean" }],
    ["an array of numbers", { type: "array", items: { type: "number" }, maxItems: 10 }],
    ["an array of flat objects", { type: "array", items: objectOf({ a: { type: "string" } }) }],
  ])("accepts %s", (_rule, node) => {
    expect(outputSchemaNodeSchema.parse(node)).toEqual(node);
  });

  it.each([
    ["a type outside the dialect", { type: "integer" }],
    ["no type", { maxLength: 3 }],
    ["an empty closed list", { type: "string", enum: [] }],
    ["a length that is not a whole number", { type: "string", maxLength: 1.5 }],
    ["a keyword of another type", { type: "boolean", minimum: 0 }],
    ["an array without items", { type: "array" }],
    ["an array of an invalid node", { type: "array", items: { type: "date" } }],
    ["a zero maxItems", { type: "array", items: { type: "number" }, maxItems: 0 }],
  ])("rejects %s", (_rule, node) => {
    expect(outputSchemaNodeSchema.safeParse(node).success).toBe(false);
  });
});

describe("outputObjectNodeSchema", () => {
  it("accepts nested objects that are closed at every level", () => {
    const node = objectOf({ wind: objectOf({ speed_ms: { type: "number" } }) });

    expect(outputObjectNodeSchema.parse(node)).toEqual(node);
  });

  it("accepts required names that are properties", () => {
    const node = objectOf({ value: { type: "number" } }, { required: ["value"] });

    expect(outputObjectNodeSchema.safeParse(node).success).toBe(true);
  });

  it("names an unsupported keyword", () => {
    const node = objectOf({ name: { type: "string", pattern: "^a" } });

    expect(firstIssue(node)).toBe('properties.name: Unrecognized key: "pattern"');
  });

  it("rejects an object that does not close itself", () => {
    expect(firstIssue({ type: "object", properties: {} })).toContain("additionalProperties");
  });

  it("rejects a nested object that allows other fields", () => {
    const open = { type: "object", properties: {}, additionalProperties: true };

    expect(firstIssue(objectOf({ wind: open }))).toContain("properties.wind.additionalProperties");
  });

  it("names a required field that is not a property", () => {
    const node = objectOf({ value: { type: "number" } }, { required: ["speed"] });

    expect(firstIssue(node)).toBe('required: required names "speed", which is not a property.');
  });

  it.each([
    "Value",
    "wind-speed",
    "9lives",
    "",
    "a".repeat(65),
  ])("rejects the property name %j", (name) => {
    expect(outputObjectNodeSchema.safeParse(objectOf({ [name]: { type: "number" } })).success).toBe(
      false,
    );
  });

  it("rejects a node that is not an object at the root", () => {
    expect(outputObjectNodeSchema.safeParse({ type: "number" }).success).toBe(false);
  });
});
