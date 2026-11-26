import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { accounts } from "../../schema/accounts-table";
import { endpointSources } from "../../schema/endpoint-sources-table";
import { endpoints } from "../../schema/endpoints-table";
import { recipeVersions } from "../../schema/recipe-versions-table";
import { sources } from "../../schema/sources-table";
import { createTestDatabase, type TestDatabase } from "../../testing/create-test-database";
import { accountRow, endpointRow, recipeVersionRow, sourceRow } from "../../testing/test-rows";
import { findEndpoint } from "./find-endpoint";

const PATH = { owner: "core", slug: "weather-now-vienna" };

let database: TestDatabase;

beforeEach(async () => {
  database = await createTestDatabase();
  await database.db.insert(accounts).values(accountRow());
  await database.db.insert(endpoints).values(endpointRow());
});

afterEach(async () => {
  await database.close();
});

describe("findEndpoint", () => {
  it("returns the endpoint with its active recipe and its sources sorted by name", async () => {
    await database.db
      .insert(recipeVersions)
      .values([
        recipeVersionRow(),
        recipeVersionRow({ id: "rv_weather_now_2", version: 2, active: true }),
      ]);
    await database.db
      .insert(sources)
      .values([
        sourceRow({ id: "src_b", name: "B source", hosts: ["b.example.org"] }),
        sourceRow({ id: "src_a", name: "A source", hosts: ["a.example.org"], attribution: null }),
      ]);
    await database.db.insert(endpointSources).values([
      { endpoint_id: "ep_weather_now", source_id: "src_b" },
      { endpoint_id: "ep_weather_now", source_id: "src_a" },
    ]);

    const found = await findEndpoint(database.db, PATH);

    expect(found?.id).toBe("ep_weather_now");
    expect(found?.owner_id).toBe("acc_core");
    expect(found?.definition).toMatchObject({
      owner: "core",
      slug: "weather-now-vienna",
      freshness: "15m",
    });
    expect(found?.recipe).toMatchObject({ id: "rv_weather_now_2", version: 2 });
    expect(found?.sources.map((source) => source.name)).toEqual(["A source", "B source"]);
    expect(
      found?.sources.map(({ docs_url, licence, attribution }) => ({
        docs_url,
        licence,
        attribution,
      })),
    ).toEqual([
      { docs_url: sourceRow().docs_url, licence: sourceRow().licence, attribution: null },
      {
        docs_url: sourceRow().docs_url,
        licence: sourceRow().licence,
        attribution: sourceRow().attribution,
      },
    ]);
    expect(new Date(found?.sources[0]?.policy_checked_at ?? "").toISOString()).toBe(
      sourceRow().policy_checked_at.toISOString(),
    );
  });

  it("returns no recipe and no sources for an endpoint that has none yet", async () => {
    await database.db.insert(recipeVersions).values(recipeVersionRow());

    const found = await findEndpoint(database.db, PATH);

    expect(found).toMatchObject({ recipe: null, sources: [] });
  });

  it.each([
    ["an owner that does not exist", { owner: "nobody", slug: PATH.slug }],
    ["a slug the owner does not have", { owner: "core", slug: "rain" }],
  ])("returns nothing for %s", async (_case, path) => {
    expect(await findEndpoint(database.db, path)).toBeUndefined();
  });

  it("refuses an output spec in the database that breaks its contract", async () => {
    await database.query("update endpoints set output_spec = '{\"schema\": 1}'");

    await expect(findEndpoint(database.db, PATH)).rejects.toThrow(
      "Stored endpoint does not match its contract.",
    );
  });
});
