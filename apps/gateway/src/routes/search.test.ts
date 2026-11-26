import { errorBodySchema } from "@repo/contracts/api/error";
import { searchPageSchema } from "@repo/contracts/search/search-page";
import { describe, expect, it } from "vitest";
import { createMemoryCatalogSearch } from "../adapters/memory/memory-catalog-search";
import { createApp } from "../app";
import { SEARCHED } from "../ports/testing/catalog-search-contract";
import { testDeps } from "../testing/test-deps";

const app = createApp(testDeps({ search: createMemoryCatalogSearch(SEARCHED) }));

function search(query: string) {
  return app(new Request(`https://api.example.com/search${query}`));
}

describe("GET /search", () => {
  it("answers a page of the contract, each endpoint with its permanent URL", async () => {
    const response = await search("?q=treasury");

    expect(response.headers.get("cache-control")).toBe("public, max-age=60");
    expect(searchPageSchema.parse(await response.json())).toEqual({
      items: [
        {
          owner: "core",
          slug: "treasury-rates",
          title: "Treasury rates",
          summary: "Average interest rates.",
          url: "https://api.example.com/@core/treasury-rates",
          price_credits: 1,
        },
      ],
      next_cursor: null,
    });
  });

  it("answers the next page for the cursor of the previous one", async () => {
    const first = searchPageSchema.parse(await (await search("?q=temperature&limit=2")).json());
    const second = searchPageSchema.parse(
      await (await search(`?q=temperature&limit=2&cursor=${first.next_cursor}`)).json(),
    );

    expect([first.items.length, second.items.length, second.next_cursor]).toEqual([2, 1, null]);
  });

  it.each([
    ["no q", ""],
    ["an empty q", "?q=%20"],
    ["a q over 200 characters", `?q=${"a".repeat(201)}`],
    ["a limit of 0", "?q=weather&limit=0"],
    ["a limit over 50", "?q=weather&limit=51"],
    ["a parameter search does not take", "?q=weather&shape=csv"],
    ["a cursor the search did not issue", "?q=weather&cursor=garbage"],
  ])("answers %s with 400 invalid_request and a hint", async (_case, query) => {
    const response = await search(query);
    const body = errorBodySchema.parse(await response.json());

    expect([response.status, body.error.code, body.error.hint === undefined]).toEqual([
      400,
      "invalid_request",
      false,
    ]);
  });
});
