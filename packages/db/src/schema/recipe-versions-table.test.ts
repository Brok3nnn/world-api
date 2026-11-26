import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestDatabase, type TestDatabase } from "../testing/create-test-database";
import { tableFacts } from "../testing/table-facts";
import { accountRow, endpointRow, recipeVersionRow } from "../testing/test-rows";
import { violatedConstraint } from "../testing/violated-constraint";
import { accounts } from "./accounts-table";
import { endpoints } from "./endpoints-table";
import { recipeVersions } from "./recipe-versions-table";

let database: TestDatabase;

beforeEach(async () => {
  database = await createTestDatabase();
  await database.db.insert(accounts).values(accountRow());
  await database.db.insert(endpoints).values(endpointRow());
});

afterEach(async () => {
  await database.close();
});

describe("recipe_versions", () => {
  it("stores an inactive version with its document as JSON", async () => {
    await database.db.insert(recipeVersions).values(recipeVersionRow());

    const [row] = await database.db.select().from(recipeVersions);

    expect(row).toMatchObject({ ...recipeVersionRow(), test_report: null, active: false });
  });

  it("declares the checks it enforces, its indexes and row-level security", async () => {
    const facts = await tableFacts(database, recipeVersions);

    expect(facts.enforcedChecks).toEqual(facts.declaredChecks);
    expect(facts.enforcedForeignKeys).toEqual(facts.declaredForeignKeys);
    expect(facts.unindexedForeignKeys).toEqual([]);
    expect(facts.constraints).toContain("recipe_versions_endpoint_version_unique");
    expect(facts.indexes).toContain("recipe_versions_one_active_idx");
    expect(facts.rowLevelSecurity).toBe(true);
  });

  it("rejects a version number used twice for one endpoint", async () => {
    await database.db.insert(recipeVersions).values(recipeVersionRow());

    const write = database.db.insert(recipeVersions).values(recipeVersionRow({ id: "rv_again" }));

    expect(await violatedConstraint(write)).toBe("recipe_versions_endpoint_version_unique");
  });

  it("allows many inactive versions but only one active version per endpoint", async () => {
    await database.db
      .insert(recipeVersions)
      .values([
        recipeVersionRow({ active: true }),
        recipeVersionRow({ id: "rv_weather_now_2", version: 2 }),
      ]);

    const write = database.db
      .insert(recipeVersions)
      .values(recipeVersionRow({ id: "rv_weather_now_3", version: 3, active: true }));

    expect(await violatedConstraint(write)).toBe("recipe_versions_one_active_idx");
  });

  it("allows one active version on each of two endpoints", async () => {
    await database.db.insert(endpoints).values(endpointRow({ id: "ep_rain", slug: "rain" }));

    await database.db
      .insert(recipeVersions)
      .values([
        recipeVersionRow({ active: true }),
        recipeVersionRow({ id: "rv_rain_1", endpoint_id: "ep_rain", active: true }),
      ]);

    expect(await database.db.select().from(recipeVersions)).toHaveLength(2);
  });

  it.each([
    ["a version number below 1", { version: 0 }, "recipe_versions_version"],
    ["an id without its prefix", { id: "weather_now_1" }, "recipe_versions_id_prefix"],
    [
      "an endpoint that does not exist",
      { endpoint_id: "ep_nothing" },
      "recipe_versions_endpoint_id_endpoints_id_fk",
    ],
  ])("rejects %s", async (_case, overrides, constraint) => {
    const write = database.db.insert(recipeVersions).values(recipeVersionRow(overrides));

    expect(await violatedConstraint(write)).toBe(constraint);
  });

  it("goes with its endpoint when the endpoint is deleted", async () => {
    await database.db.insert(recipeVersions).values(recipeVersionRow());

    await database.db.delete(endpoints).where(eq(endpoints.id, "ep_weather_now"));

    expect(await database.db.select().from(recipeVersions)).toEqual([]);
  });
});
