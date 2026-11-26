import type { EndpointId, RecipeVersionId } from "@repo/core/ids/id";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { accounts } from "../../schema/accounts-table";
import { endpoints } from "../../schema/endpoints-table";
import { recipeVersions } from "../../schema/recipe-versions-table";
import { createTestDatabase, type TestDatabase } from "../../testing/create-test-database";
import { accountRow, endpointRow, recipeVersionRow } from "../../testing/test-rows";
import { readLatestValue } from "./read-latest-value";
import { recordRefreshFailure } from "./record-refresh-failure";
import { storeRefreshedValue } from "./store-refreshed-value";

// Safe: the literals have the prefix and shape of their kinds.
const ENDPOINT = "ep_weather_now" as EndpointId;
const VALUE = {
  data: { temperature_c: 6.4 },
  as_of: new Date("2026-11-21T11:59:30Z"),
  fetched_at: new Date("2026-11-21T12:00:00Z"),
  expires_at: new Date("2026-11-21T12:15:00Z"),
  recipe_version_id: "rv_weather_now_1" as RecipeVersionId,
};

let database: TestDatabase;

beforeEach(async () => {
  database = await createTestDatabase();
  await database.db.insert(accounts).values(accountRow());
  await database.db.insert(endpoints).values(endpointRow());
  await database.db.insert(recipeVersions).values(recipeVersionRow({ active: true }));
});

afterEach(async () => {
  await database.close();
});

function store(value = VALUE) {
  return storeRefreshedValue(database.db, { endpoint_id: ENDPOINT, value });
}

function fail(error = "fetch_timeout") {
  return recordRefreshFailure(database.db, { endpoint_id: ENDPOINT, error });
}

describe("latest value queries", () => {
  it("find nothing for an endpoint that was never refreshed", async () => {
    expect(await readLatestValue(database.db, ENDPOINT)).toBeUndefined();
  });

  it("store a refreshed value and read it back", async () => {
    expect(await store()).toEqual({ ok: true, value: undefined });

    expect(await readLatestValue(database.db, ENDPOINT)).toEqual({
      value: VALUE,
      consecutive_failures: 0,
      last_error: null,
    });
  });

  it("replace the stored value with a newer one", async () => {
    await store();

    await store({ ...VALUE, data: { temperature_c: 7.1 } });

    expect((await readLatestValue(database.db, ENDPOINT))?.value?.data).toEqual({
      temperature_c: 7.1,
    });
  });

  it("count failures before any value exists", async () => {
    expect(await fail()).toBe(1);
    expect(await fail("fetch_failed")).toBe(2);

    expect(await readLatestValue(database.db, ENDPOINT)).toEqual({
      value: null,
      consecutive_failures: 2,
      last_error: "fetch_failed",
    });
  });

  it("keep the stored value while counting failures", async () => {
    await store();

    await fail();

    expect(await readLatestValue(database.db, ENDPOINT)).toMatchObject({
      value: VALUE,
      consecutive_failures: 1,
    });
  });

  it("clear the failures when a refresh succeeds again", async () => {
    await fail();
    await fail();

    await store();

    expect(await readLatestValue(database.db, ENDPOINT)).toMatchObject({
      consecutive_failures: 0,
      last_error: null,
    });
  });

  it("refuse a value that is not an object of fields", async () => {
    const result = await storeRefreshedValue(database.db, {
      endpoint_id: ENDPOINT,
      value: { ...VALUE, data: [1, 2] },
    });

    expect(result).toEqual({ ok: false, error: { code: "invalid_value" } });
    expect(await readLatestValue(database.db, ENDPOINT)).toBeUndefined();
  });
});
