import { recordRefreshFailure } from "@repo/db/queries/value/record-refresh-failure";
import { accounts } from "@repo/db/schema/accounts-table";
import { endpoints } from "@repo/db/schema/endpoints-table";
import { recipeVersions } from "@repo/db/schema/recipe-versions-table";
import { valuesHistory } from "@repo/db/schema/values-history-table";
import { createTestDatabase } from "@repo/db/testing/create-test-database";
import { accountRow, endpointRow, recipeVersionRow } from "@repo/db/testing/test-rows";
import { describe, expect, it } from "vitest";
import { describeValueStore } from "../../ports/testing/value-store-contract";
import { testId } from "../../testing/test-deps";
import { createPostgresValueStore } from "./postgres-value-store";

async function databaseWithEndpoint() {
  const database = await createTestDatabase();
  await database.db.insert(accounts).values(accountRow());
  await database.db.insert(endpoints).values(endpointRow());
  await database.db.insert(recipeVersions).values(recipeVersionRow({ active: true }));
  return database;
}

describeValueStore("The Postgres value store", async () => {
  const database = await databaseWithEndpoint();
  return { store: createPostgresValueStore(database.db), close: () => database.close() };
});

describe("createPostgresValueStore", () => {
  it("writes a history entry as a row of values_history", async () => {
    const database = await databaseWithEndpoint();
    const store = createPostgresValueStore(database.db);

    await store.appendHistory({
      id: testId("value", "val_weather_now_1"),
      endpointId: testId("endpoint", "ep_weather_now"),
      data: { temperature_c: 4.2 },
      asOf: new Date("2026-11-22T09:55:00.000Z"),
      recipeVersionId: testId("recipeVersion", "rv_weather_now_1"),
    });

    expect(await database.db.select({ data: valuesHistory.data }).from(valuesHistory)).toEqual([
      { data: { temperature_c: 4.2 } },
    ]);
    await database.close();
  });

  it("reads failures counted before any value was stored", async () => {
    const database = await databaseWithEndpoint();
    const endpointId = testId("endpoint", "ep_weather_now");
    await recordRefreshFailure(database.db, { endpoint_id: endpointId, error: "fetch_failed" });

    expect(await createPostgresValueStore(database.db).readLatest(endpointId)).toEqual({
      value: null,
      consecutiveFailures: 1,
    });
    await database.close();
  });

  it("treats a value the store refuses as a defect", async () => {
    const database = await databaseWithEndpoint();
    const store = createPostgresValueStore(database.db);
    const notJson = { temperature_c: Number.NaN };
    const recipeVersionId = testId("recipeVersion", "rv_weather_now_1");
    const at = new Date("2026-11-22T10:00:00.000Z");

    await expect(
      store.storeRefreshed(testId("endpoint", "ep_weather_now"), {
        data: notJson,
        asOf: at,
        fetchedAt: at,
        expiresAt: new Date("2026-11-22T10:15:00.000Z"),
        recipeVersionId,
      }),
    ).rejects.toThrow("refused");
    await expect(
      store.appendHistory({
        id: testId("value", "val_weather_now_1"),
        endpointId: testId("endpoint", "ep_weather_now"),
        data: notJson,
        asOf: at,
        recipeVersionId,
      }),
    ).rejects.toThrow("refused");
    await database.close();
  });
});
