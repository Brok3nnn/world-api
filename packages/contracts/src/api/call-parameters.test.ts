import { describe, expect, it } from "vitest";
import { callParametersSchema } from "./call-parameters";

function accepts(query: Record<string, string>): boolean {
  return callParametersSchema.safeParse(query).success;
}

describe("callParametersSchema", () => {
  it("defaults to the json shape when no parameter is given", () => {
    expect(callParametersSchema.parse({})).toEqual({ shape: "json" });
  });

  it("parses every parameter from its text form", () => {
    const query = { shape: "csv", max_age: "60", max_price: "5" };

    expect(callParametersSchema.parse(query)).toEqual({ shape: "csv", max_age: 60, max_price: 5 });
  });

  it.each([
    ["a parameter the API does not define", { city: "vienna" }],
    ["a question, which no shape answers", { shape: "json", ask: "Will it rain?" }],
  ])("rejects %s", (_rule, query) => {
    expect(accepts(query)).toBe(false);
  });

  it("rejects a shape that is not listed", () => {
    expect(accepts({ shape: "xml" })).toBe(false);
  });

  it.each([
    ["zero", "0"],
    ["a decimal", "1.5"],
    ["more than a year", "31536001"],
  ])("rejects a max_age of %s", (_rule, max_age) => {
    expect(accepts({ max_age })).toBe(false);
  });

  it("rejects a max_price that is not a whole number of credits", () => {
    expect(accepts({ max_price: "0.01" })).toBe(false);
  });
});
