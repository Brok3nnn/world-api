import type { EndpointId, RecipeVersionId } from "@repo/core/ids/id";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { accounts } from "../../schema/accounts-table";
import { endpoints } from "../../schema/endpoints-table";
import { recipeVersions } from "../../schema/recipe-versions-table";
import { createTestDatabase, type TestDatabase } from "../../testing/create-test-database";
import { accountRow, endpointRow, recipeVersionRow } from "../../testing/test-rows";
import { activateRecipeVersion } from "./activate-recipe-version";

// Safe: the literals have the prefix and shape of their kinds.
const WEATHER = "ep_weather_now" as EndpointId;
const version = (id: string) => id as RecipeVersionId;

let database: TestDatabase;

beforeEach(async () => {
  database = await createTestDatabase();
  await database.db.insert(accounts).values(accountRow());
  await database.db
    .insert(endpoints)
    .values([endpointRow(), endpointRow({ id: "ep_rain", slug: "rain" })]);
  await database.db
    .insert(recipeVersions)
    .values([
      recipeVersionRow({ active: true }),
      recipeVersionRow({ id: "rv_weather_now_2", version: 2 }),
      recipeVersionRow({ id: "rv_rain_1", endpoint_id: "ep_rain", active: true }),
    ]);
});

afterEach(async () => {
  await database.close();
});

async function activeVersions(): Promise<string[]> {
  const rows = await database.query("select id from recipe_versions where active order by id");
  return rows.map((row) => String(row.id));
}

describe("activateRecipeVersion", () => {
  it("moves the active recipe to another version of the same endpoint", async () => {
    const result = await activateRecipeVersion(database.db, {
      endpoint_id: WEATHER,
      version_id: version("rv_weather_now_2"),
    });

    expect(result.ok).toBe(true);
    expect(await activeVersions()).toEqual(["rv_rain_1", "rv_weather_now_2"]);
  });

  it("keeps an already active version active", async () => {
    await activateRecipeVersion(database.db, {
      endpoint_id: WEATHER,
      version_id: version("rv_weather_now_1"),
    });

    expect(await activeVersions()).toEqual(["rv_rain_1", "rv_weather_now_1"]);
  });

  it("refuses a version of another endpoint and changes nothing", async () => {
    const result = await activateRecipeVersion(database.db, {
      endpoint_id: WEATHER,
      version_id: version("rv_rain_1"),
    });

    expect(result).toEqual({ ok: false, error: { code: "not_found" } });
    expect(await activeVersions()).toEqual(["rv_rain_1", "rv_weather_now_1"]);
  });
});
