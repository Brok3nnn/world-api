import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestDatabase, type TestDatabase } from "../testing/create-test-database";
import { tableFacts } from "../testing/table-facts";
import {
  accountRow,
  endpointRow,
  recipeVersionRow,
  valueHistoryRow,
  valueLatestRow,
} from "../testing/test-rows";
import { violatedConstraint } from "../testing/violated-constraint";
import { accounts } from "./accounts-table";
import { endpoints } from "./endpoints-table";
import { recipeVersions } from "./recipe-versions-table";
import { valuesHistory } from "./values-history-table";
import { valuesLatest } from "./values-latest-table";

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

describe("values_latest", () => {
  it("stores a complete value with no failures", async () => {
    await database.db.insert(valuesLatest).values(valueLatestRow());

    const [row] = await database.db.select().from(valuesLatest);

    expect(row).toMatchObject({ ...valueLatestRow(), consecutive_failures: 0, last_error: null });
  });

  it("counts failures before any value exists", async () => {
    const row = {
      endpoint_id: "ep_weather_now",
      consecutive_failures: 2,
      last_error: "fetch_timeout",
    };

    await database.db.insert(valuesLatest).values(row);

    expect(await database.db.select().from(valuesLatest)).toMatchObject([{ ...row, data: null }]);
  });

  it("declares the checks and foreign keys it enforces and has row-level security", async () => {
    const facts = await tableFacts(database, valuesLatest);

    expect(facts.enforcedChecks).toEqual(facts.declaredChecks);
    expect(facts.enforcedForeignKeys).toEqual(facts.declaredForeignKeys);
    expect(facts.unindexedForeignKeys).toEqual([]);
    expect(facts.rowLevelSecurity).toBe(true);
  });

  it.each([
    ["a value without its observation time", { as_of: null }, "values_latest_value_complete"],
    [
      "a value without its recipe version",
      { recipe_version_id: null },
      "values_latest_value_complete",
    ],
    [
      "an expiry that is not after the fetch",
      { expires_at: new Date("2026-11-21T12:00:00Z") },
      "values_latest_expiry",
    ],
    ["a negative failure count", { consecutive_failures: -1 }, "values_latest_failures"],
    [
      "an endpoint that does not exist",
      { endpoint_id: "ep_nothing" },
      "values_latest_endpoint_id_endpoints_id_fk",
    ],
  ])("rejects %s", async (_case, overrides, constraint) => {
    const write = database.db.insert(valuesLatest).values(valueLatestRow(overrides));

    expect(await violatedConstraint(write)).toBe(constraint);
  });

  it("goes with its endpoint, together with its history and recipe versions", async () => {
    await database.db.insert(valuesLatest).values(valueLatestRow());
    await database.db.insert(valuesHistory).values(valueHistoryRow());

    await database.db.delete(endpoints).where(eq(endpoints.id, "ep_weather_now"));

    expect(await database.db.select().from(valuesLatest)).toEqual([]);
    expect(await database.db.select().from(valuesHistory)).toEqual([]);
  });
});
