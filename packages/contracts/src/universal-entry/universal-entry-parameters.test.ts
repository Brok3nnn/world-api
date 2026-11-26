import { describe, expect, it } from "vitest";
import { universalEntryParametersSchema } from "./universal-entry-parameters";

function accepts(query: Record<string, string>): boolean {
  return universalEntryParametersSchema.safeParse(query).success;
}

describe("universalEntryParametersSchema", () => {
  it("defaults to the json shape and no waiting", () => {
    expect(universalEntryParametersSchema.parse({ q: "rain in Vienna" })).toEqual({
      q: "rain in Vienna",
      shape: "json",
      wait: 0,
    });
  });

  it("parses every parameter from its text form", () => {
    const query = { q: "rain", shape: "number", max_price: "5", wait: "30" };

    expect(universalEntryParametersSchema.parse(query)).toEqual({
      ...query,
      max_price: 5,
      wait: 30,
    });
  });

  it.each([
    ["no question", {}],
    ["a wait above 30 seconds", { q: "rain", wait: "31" }],
    ["a negative wait", { q: "rain", wait: "-1" }],
    ["a shape that is not listed", { q: "rain", shape: "xml" }],
    ["a max_price that is not a whole number of credits", { q: "rain", max_price: "cheap" }],
    ["a parameter the API does not define", { q: "rain", max_age: "60" }],
  ])("rejects %s", (_rule, query) => {
    expect(accepts(query)).toBe(false);
  });
});
