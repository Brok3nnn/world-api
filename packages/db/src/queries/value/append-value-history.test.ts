import type { EndpointId, RecipeVersionId, ValueId } from "@repo/core/ids/id";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { accounts } from "../../schema/accounts-table";
import { endpoints } from "../../schema/endpoints-table";
import { recipeVersions } from "../../schema/recipe-versions-table";
import { valuesHistory } from "../../schema/values-history-table";
import { createTestDatabase, type TestDatabase } from "../../testing/create-test-database";
import { accountRow, endpointRow, recipeVersionRow } from "../../testing/test-rows";
import { appendValueHistory } from "./append-value-history";

// Safe: the literals have the prefix and shape of their kinds.
const ENTRY = {
  id: "val_1" as ValueId,
  endpoint_id: "ep_weather_now" as EndpointId,
  data: { temperature_c: 6.4 },
  as_of: new Date("2026-11-21T11:59:30Z"),
  recipe_version_id: "rv_weather_now_1" as RecipeVersionId,
};

let database: TestDatabase;

beforeEach(async () => {
  database = await createTestDatabase();
  await database.db.insert(accounts).values(accountRow());
  await database.db.insert(endpoints).values(endpointRow());
  await database.db.insert(recipeVersions).values(recipeVersionRow());
});

afterEach(async () => {
  await database.close();
});

describe("appendValueHistory", () => {
  it("adds every past value as its own row", async () => {
    await appendValueHistory(database.db, ENTRY);
    await appendValueHistory(database.db, {
      ...ENTRY,
      id: "val_2" as ValueId,
      data: { temperature_c: 7 },
    });

    expect(await database.db.select().from(valuesHistory)).toHaveLength(2);
  });

  it("refuses a value that is not an object of fields", async () => {
    expect(await appendValueHistory(database.db, { ...ENTRY, data: "6.4" })).toEqual({
      ok: false,
      error: { code: "invalid_value" },
    });
    expect(await database.db.select().from(valuesHistory)).toEqual([]);
  });
});
