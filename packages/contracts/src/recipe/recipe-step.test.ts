import { describe, expect, it } from "vitest";
import { recipeStepSchema, stepIdSchema } from "./recipe-step";

const HTTP_GET = {
  id: "page",
  use: "http.get",
  url: "https://data.example.org/v1",
  expect: "json",
};
const TRANSFORM = { id: "out", use: "transform", expr: '{ "value": page.value }' };
const HTML_SELECT = { id: "cell", use: "html.select", from: "page", selector: "td.rate" };
const TEXT_MATCH = { id: "level", use: "text.match", from: "page", pattern: "(\\d+) cm" };
const ENDPOINT_READ = { id: "rate", use: "endpoint.read", ref: "@core/eur-huf" };

function accepts(step: Record<string, unknown>): boolean {
  return recipeStepSchema.safeParse(step).success;
}

describe("stepIdSchema", () => {
  it.each(["a", "page_2", "a".repeat(32)])("accepts %s", (id) => {
    expect(stepIdSchema.parse(id)).toBe(id);
  });

  it.each(["", "Page", "2nd", "my-step", "a".repeat(33)])("rejects %j", (id) => {
    expect(stepIdSchema.safeParse(id).success).toBe(false);
  });
});

describe("recipeStepSchema", () => {
  it.each([
    ["http.get", HTTP_GET],
    ["http.get with the allowed headers", { ...HTTP_GET, headers: { accept: "text/csv" } }],
    ["transform", TRANSFORM],
    ["html.select", HTML_SELECT],
    ["html.select of an attribute of all matches", { ...HTML_SELECT, attr: "href", all: true }],
    ["text.match", TEXT_MATCH],
    ["text.match with flags", { ...TEXT_MATCH, flags: "im" }],
    ["endpoint.read", ENDPOINT_READ],
  ])("accepts %s", (_kind, step) => {
    expect(recipeStepSchema.parse(step)).toEqual(step);
  });

  it("rejects a step kind that does not exist", () => {
    expect(accepts({ id: "x", use: "code.run", source: "return 1" })).toBe(false);
  });

  it.each([
    HTTP_GET,
    TRANSFORM,
    HTML_SELECT,
    TEXT_MATCH,
    ENDPOINT_READ,
  ])("rejects a $use step with an invalid id or a field of another kind", (step) => {
    expect(accepts({ ...step, id: "Bad Id" })).toBe(false);
    expect(accepts({ ...step, timeout: 5 })).toBe(false);
  });

  it.each([
    ["a URL that is not https", { url: "http://data.example.org/v1" }],
    ["a URL longer than 2000 characters", { url: `https://data.example.org/${"a".repeat(2000)}` }],
    ["an unknown expectation", { expect: "xml" }],
    ["a header outside the safe list", { headers: { authorization: "Bearer x" } }],
    ["an empty header value", { headers: { accept: "" } }],
  ])("rejects http.get with %s", (_rule, overrides) => {
    expect(accepts({ ...HTTP_GET, ...overrides })).toBe(false);
  });

  it.each([
    ["an empty expression", { expr: "" }],
    ["an expression longer than 2000 characters", { expr: "a".repeat(2001) }],
  ])("rejects transform with %s", (_rule, overrides) => {
    expect(accepts({ ...TRANSFORM, ...overrides })).toBe(false);
  });

  it.each([
    ["no source step", { from: undefined }],
    ["an empty selector", { selector: "" }],
    ["a selector longer than 300 characters", { selector: "a".repeat(301) }],
    ["an attribute name with a space", { attr: "data value" }],
    ["all that is not a boolean", { all: "yes" }],
  ])("rejects html.select with %s", (_rule, overrides) => {
    expect(accepts({ ...HTML_SELECT, ...overrides })).toBe(false);
  });

  it.each([
    ["no source step", { from: undefined }],
    ["an empty pattern", { pattern: "" }],
    ["a pattern longer than 300 characters", { pattern: "a".repeat(301) }],
    ["the global flag", { flags: "g" }],
    ["a repeated flag", { flags: "ii" }],
  ])("rejects text.match with %s", (_rule, overrides) => {
    expect(accepts({ ...TEXT_MATCH, ...overrides })).toBe(false);
  });

  it("rejects endpoint.read of something that is not an endpoint reference", () => {
    expect(accepts({ ...ENDPOINT_READ, ref: "https://api.example.com/@core/eur-huf" })).toBe(false);
  });
});
