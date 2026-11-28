import { describe, expect, it } from "vitest";
import { searchParametersSchema } from "./search-parameters";

function accepts(query: Record<string, string>): boolean {
  return searchParametersSchema.safeParse(query).success;
}

describe("searchParametersSchema", () => {
  it("trims the query and applies the default page size", () => {
    expect(searchParametersSchema.parse({ q: "  rain  " })).toEqual({ q: "rain", limit: 20 });
  });

  it("parses the page size and keeps the cursor", () => {
    const query = { q: "rain", limit: "50", cursor: "b2Zmc2V0OjIw" };

    expect(searchParametersSchema.parse(query)).toEqual({ ...query, limit: 50 });
  });

  it.each([
    ["no query", {}],
    ["a query of only spaces", { q: "   " }],
    ["a query of 201 characters", { q: "a".repeat(201) }],
    ["a query with a NUL character", { q: "rain\u0000" }],
    ["a page size of zero", { q: "rain", limit: "0" }],
    ["a page size above the maximum", { q: "rain", limit: "51" }],
    ["an empty cursor", { q: "rain", cursor: "" }],
    ["a parameter the API does not define", { q: "rain", sort: "new" }],
  ])("rejects %s", (_rule, query) => {
    expect(accepts(query)).toBe(false);
  });
});
