import { PASSING_TEST_REPORT_EXAMPLE } from "@repo/contracts/build/examples/build-report-examples";
import { INVALID_RECIPE_EXAMPLES } from "@repo/contracts/recipe/examples/invalid-recipes";
import { VALID_RECIPE_EXAMPLES } from "@repo/contracts/recipe/examples/valid-recipes";
import type { EndpointId, RecipeVersionId } from "@repo/core/ids/id";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { accounts } from "../../schema/accounts-table";
import { endpoints } from "../../schema/endpoints-table";
import { recipeVersions } from "../../schema/recipe-versions-table";
import { createTestDatabase, type TestDatabase } from "../../testing/create-test-database";
import { accountRow, endpointRow } from "../../testing/test-rows";
import { insertRecipeVersion } from "./insert-recipe-version";

// Safe: the literals have the prefix and shape of their kinds.
const VERSION = {
  id: "rv_weather_now_1" as RecipeVersionId,
  endpoint_id: "ep_weather_now" as EndpointId,
  version: 1,
  document: VALID_RECIPE_EXAMPLES.page,
};

let database: TestDatabase;

beforeEach(async () => {
  database = await createTestDatabase();
  await database.db.insert(accounts).values(accountRow());
  await database.db.insert(endpoints).values(endpointRow());
});

afterEach(async () => {
  await database.close();
});

describe("insertRecipeVersion", () => {
  it("adds an inactive version with its test report", async () => {
    const result = await insertRecipeVersion(database.db, {
      ...VERSION,
      test_report: PASSING_TEST_REPORT_EXAMPLE,
    });

    expect(result).toEqual({ ok: true, value: undefined });
    expect(await database.db.select().from(recipeVersions)).toMatchObject([
      { id: VERSION.id, active: false, test_report: PASSING_TEST_REPORT_EXAMPLE },
    ]);
  });

  it("adds a version written by hand, without a test report", async () => {
    await insertRecipeVersion(database.db, VERSION);

    expect(await database.db.select().from(recipeVersions)).toMatchObject([{ test_report: null }]);
  });

  it("refuses a document that breaks a recipe rule, before it reaches the database", async () => {
    const result = await insertRecipeVersion(database.db, {
      ...VERSION,
      document: INVALID_RECIPE_EXAMPLES.forward_reference,
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "invalid_document",
        issues: ['Step "cell" reads "page", which is not an earlier step.'],
      },
    });
    expect(await database.db.select().from(recipeVersions)).toEqual([]);
  });

  it("refuses a test report that breaks its contract", async () => {
    const result = await insertRecipeVersion(database.db, {
      ...VERSION,
      test_report: { passed: "yes" },
    });

    expect(result.ok || result.error.code).toBe("invalid_test_report");
    expect(await database.db.select().from(recipeVersions)).toEqual([]);
  });
});
