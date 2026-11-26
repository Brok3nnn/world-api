import { describe, expect, it } from "vitest";
import { SEARCH_PAGE_EXAMPLE } from "./examples/search-page-example";
import { searchPageSchema } from "./search-page";

const ITEM = SEARCH_PAGE_EXAMPLE.items[0];

function acceptsItem(overrides: Record<string, unknown>): boolean {
  return searchPageSchema.safeParse({ items: [{ ...ITEM, ...overrides }], next_cursor: null })
    .success;
}

describe("searchPageSchema", () => {
  it("accepts the example page", () => {
    expect(searchPageSchema.parse(SEARCH_PAGE_EXAMPLE)).toEqual(SEARCH_PAGE_EXAMPLE);
  });

  it("accepts an empty last page", () => {
    expect(searchPageSchema.safeParse({ items: [], next_cursor: null }).success).toBe(true);
  });

  it("accepts a page of the maximum size", () => {
    const page = { items: Array.from({ length: 50 }, () => ITEM), next_cursor: null };

    expect(searchPageSchema.safeParse(page).success).toBe(true);
  });

  it("rejects a page above the maximum size", () => {
    const page = { items: Array.from({ length: 51 }, () => ITEM), next_cursor: null };

    expect(searchPageSchema.safeParse(page).success).toBe(false);
  });

  it("rejects a page without next_cursor", () => {
    expect(searchPageSchema.safeParse({ items: [] }).success).toBe(false);
  });

  it.each([
    ["an invalid owner", { owner: "C" }],
    ["an invalid slug", { slug: "-rain" }],
    ["an empty title", { title: "" }],
    ["a summary of 281 characters", { summary: "a".repeat(281) }],
    ["a URL that is not https", { url: "http://api.example.com/@core/topeka-weather" }],
    ["a negative price", { price_credits: -1 }],
    ["a field that is not part of a result", { likes: 3 }],
  ])("rejects an item with %s", (_rule, overrides) => {
    expect(acceptsItem(overrides)).toBe(false);
  });
});
