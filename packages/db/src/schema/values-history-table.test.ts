import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestDatabase, type TestDatabase } from "../testing/create-test-database";
import { tableFacts } from "../testing/table-facts";
import { accountRow, endpointRow, recipeVersionRow, valueHistoryRow } from "../testing/test-rows";
import { violatedConstraint } from "../testing/violated-constraint";
import { accounts } from "./accounts-table";
import { endpoints } from "./endpoints-table";
import { recipeVersions } from "./recipe-versions-table";
import { valuesHistory } from "./values-history-table";

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

describe("values_history", () => {
  it("keeps every value of an endpoint", async () => {
    await database.db
      .insert(valuesHistory)
      .values([valueHistoryRow(), valueHistoryRow({ id: "val_2", data: { temperature_c: 7 } })]);

    expect(await database.db.select().from(valuesHistory)).toHaveLength(2);
  });

  it("declares what it enforces, has its index and row-level security", async () => {
    const facts = await tableFacts(database, valuesHistory);

    expect(facts.enforcedChecks).toEqual(facts.declaredChecks);
    expect(facts.enforcedForeignKeys).toEqual(facts.declaredForeignKeys);
    expect(facts.unindexedForeignKeys).toEqual([]);
    expect(facts.indexes).toContain("values_history_endpoint_as_of_idx");
    expect(facts.rowLevelSecurity).toBe(true);
  });

  it.each([
    ["an id without its prefix", { id: "1" }, "values_history_id_prefix"],
    [
      "a recipe version that does not exist",
      { recipe_version_id: "rv_nothing" },
      "values_history_recipe_version_id_recipe_versions_id_fk",
    ],
  ])("rejects %s", async (_case, overrides, constraint) => {
    const write = database.db.insert(valuesHistory).values(valueHistoryRow(overrides));

    expect(await violatedConstraint(write)).toBe(constraint);
  });
});
