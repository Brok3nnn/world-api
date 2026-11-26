import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { accounts } from "../../schema/accounts-table";
import { endpoints } from "../../schema/endpoints-table";
import { createTestDatabase, type TestDatabase } from "../../testing/create-test-database";
import { accountRow, endpointRow } from "../../testing/test-rows";
import { searchCatalogEndpoints } from "./search-catalog-endpoints";

let database: TestDatabase;

beforeEach(async () => {
  database = await createTestDatabase();
  await database.db.insert(accounts).values(accountRow());
  await database.db.insert(endpoints).values([
    endpointRow({
      id: "ep_vienna",
      slug: "weather-vienna",
      title: "Weather now",
      summary: "Air temperature in Vienna.",
    }),
    endpointRow({
      id: "ep_graz",
      slug: "weather-graz",
      title: "Weather now",
      summary: "Air temperature in Graz.",
      status: "degraded",
    }),
    endpointRow({
      id: "ep_linz",
      slug: "weather-linz",
      title: "Weather now",
      summary: "Air temperature in Linz.",
    }),
    endpointRow({
      id: "ep_rates",
      slug: "treasury-rates",
      title: "Treasury rates",
      summary: "Average interest rates.",
      category: "finance",
    }),
    endpointRow({
      id: "ep_private",
      slug: "weather-private",
      title: "Weather now",
      summary: "Private.",
      visibility: "private",
    }),
    endpointRow({
      id: "ep_disabled",
      slug: "weather-off",
      title: "Weather now",
      summary: "Disabled.",
      status: "disabled",
    }),
  ]);
});

afterEach(async () => {
  await database.close();
});

async function slugs(query: string, limit = 10, cursor?: string) {
  const found = await searchCatalogEndpoints(database.db, {
    query,
    limit,
    ...(cursor === undefined ? {} : { cursor }),
  });
  return found.ok
    ? { slugs: found.value.items.map((item) => item.slug).sort(), next: found.value.nextCursor }
    : found.error;
}

describe("searchCatalogEndpoints", () => {
  it("finds public endpoints that answer calls by a word of the title, never private or disabled ones", async () => {
    expect(await slugs("weather")).toEqual({
      slugs: ["weather-graz", "weather-linz", "weather-vienna"],
      next: null,
    });
  });

  it.each([
    ["a word of the summary", "Vienna", ["weather-vienna"]],
    ["the category", "finance", ["treasury-rates"]],
    ["several words", "interest rates", ["treasury-rates"]],
    [
      "text with search syntax",
      'weather -"no such" & (',
      ["weather-graz", "weather-linz", "weather-vienna"],
    ],
  ])("matches %s", async (_case, query, expected) => {
    expect(await slugs(query)).toMatchObject({ slugs: expected });
  });

  it("returns the endpoint as a result list shows it", async () => {
    const found = await searchCatalogEndpoints(database.db, { query: "treasury", limit: 10 });

    expect(found.ok && found.value.items).toEqual([
      {
        owner: "core",
        slug: "treasury-rates",
        title: "Treasury rates",
        summary: "Average interest rates.",
        price_credits: 1,
      },
    ]);
  });

  it("pages through the matches with the cursor it issues", async () => {
    const first = await slugs("weather", 2);
    const firstPage = "slugs" in first ? first : { slugs: [], next: null };
    const second = await slugs("weather", 2, firstPage.next ?? undefined);

    expect(firstPage.slugs).toHaveLength(2);
    expect(firstPage.next).toBe(Buffer.from("offset:2").toString("base64url"));
    expect(second).toMatchObject({ next: null });
    expect([...firstPage.slugs, ...("slugs" in second ? second.slugs : [])].sort()).toEqual([
      "weather-graz",
      "weather-linz",
      "weather-vienna",
    ]);
  });

  it.each([
    "garbage",
    Buffer.from("offset:0").toString("base64url"),
    Buffer.from("offset:501").toString("base64url"),
    Buffer.from("offset:-2").toString("base64url"),
  ])("refuses the cursor %s, which it did not issue", async (cursor) => {
    expect(await slugs("weather", 2, cursor)).toEqual({ code: "invalid_cursor" });
  });
});
