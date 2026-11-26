import { endpointDefinitionSchema } from "@repo/contracts/endpoint/endpoint-definition";
import { recipeSchema } from "@repo/contracts/recipe/recipe-schema";
import { sourceDefinitionSchema } from "@repo/contracts/source/source-definition";
import { callPriceCredits } from "@repo/core/pricing/call-price";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { accounts } from "../schema/accounts-table";
import { sources } from "../schema/sources-table";
import { createTestDatabase, type TestDatabase } from "../testing/create-test-database";
import { CATALOG_ENDPOINTS } from "./catalog/catalog-endpoints";
import { CORE_ACCOUNT } from "./core-account";
import { seedDatabase } from "./seed-database";
import { SOURCE_REGISTRY } from "./source-registry";

/**
 * The categories a cleared source covers today. Developer registries and a knowledge base have
 * only conditional sources so far, so they are not covered yet.
 */
const COVERED_CATEGORIES = [
  "weather",
  "air quality",
  "exchange rate",
  "market data",
  "map",
  "technology news",
];

let database: TestDatabase;

beforeEach(async () => {
  database = await createTestDatabase();
});

afterEach(async () => {
  await database.close();
});

/** Everything stored, without the time of the last write, which a repeated seed may move. */
async function storedContent() {
  const rows = await database.db.select().from(sources);
  const catalog = await database.query("select id, status from endpoints order by id");
  const links = await database.query(
    "select endpoint_id, source_id from endpoint_sources order by endpoint_id",
  );
  return {
    sources: rows
      .map(({ updated_at: _updated, ...row }) => row)
      .sort((a, b) => a.id.localeCompare(b.id)),
    catalog,
    links,
  };
}

describe("SOURCE_REGISTRY", () => {
  it("has sources with unique ids and names", () => {
    expect(SOURCE_REGISTRY.length).toBeGreaterThan(0);
    expect(new Set(SOURCE_REGISTRY.map((source) => source.id)).size).toBe(SOURCE_REGISTRY.length);
    expect(new Set(SOURCE_REGISTRY.map((source) => source.definition.name)).size).toBe(
      SOURCE_REGISTRY.length,
    );
  });

  it.each(
    SOURCE_REGISTRY.map((source) => [source.id, source] as const),
  )("%s passes the contract, is cleared, and records its licence, terms and evidence", (_id, source) => {
    expect(sourceDefinitionSchema.safeParse(source.definition).success).toBe(true);
    expect(source.definition).toMatchObject({ tier: "green" });
    expect(source.definition.licence.trim()).not.toBe("");
    expect(source.definition.terms.trim()).not.toBe("");
    expect(source.definition.evidence_url).toMatch(/^https:\/\//);
  });

  it.each(
    SOURCE_REGISTRY.map((source) => [source.id, source.definition.attribution] as const),
  )("%s has an attribution that can be shown as it is", (_id, attribution) => {
    expect(attribution ?? "").not.toMatch(/[<>]|required|suggested/i);
  });

  it.each(COVERED_CATEGORIES)("covers %s", (category) => {
    const keywords = SOURCE_REGISTRY.flatMap((source) =>
      source.definition.capabilities.offerings.flatMap((offering) => offering.keywords),
    );

    expect(keywords).toContain(category);
  });
});

describe("seedDatabase", () => {
  it("writes the platform account and every source", async () => {
    expect(await seedDatabase(database.db)).toEqual({
      sources: SOURCE_REGISTRY.length,
      endpoints: CATALOG_ENDPOINTS.length,
    });

    expect(await database.db.select().from(accounts)).toMatchObject([CORE_ACCOUNT]);
    expect(await database.db.select().from(sources)).toHaveLength(SOURCE_REGISTRY.length);
  });

  it("changes nothing when it runs a second time", async () => {
    await seedDatabase(database.db);
    const first = await storedContent();

    await seedDatabase(database.db);

    expect(await storedContent()).toEqual(first);
    expect(await database.db.select().from(accounts)).toHaveLength(1);
  });
});

describe("the catalog seed", () => {
  it.each(
    CATALOG_ENDPOINTS.map((seed) => [seed.id, seed] as const),
  )("%s keeps every contract", (_id, seed) => {
    expect(endpointDefinitionSchema.safeParse(seed.definition).success).toBe(true);
    expect(recipeSchema.safeParse(seed.recipe).success).toBe(true);
    expect(seed.definition.price_credits).toBe(callPriceCredits(recipeSchema.parse(seed.recipe)));
    expect(
      seed.sources.every((source) =>
        SOURCE_REGISTRY.some((registered) => registered.id === source),
      ),
    ).toBe(true);
  });

  it("feeds every source into an endpoint, but the air data API, which needs a date in its URL", () => {
    const used = new Set(CATALOG_ENDPOINTS.flatMap((seed) => seed.sources));

    expect(SOURCE_REGISTRY.map((source) => source.id).filter((id) => !used.has(id))).toEqual([
      "src_uba_air_data",
    ]);
  });

  it("writes each endpoint live, with one active recipe version", async () => {
    await seedDatabase(database.db);

    expect(
      await database.query(
        "select endpoint_id, version from recipe_versions where active order by endpoint_id",
      ),
    ).toEqual(
      CATALOG_ENDPOINTS.map((seed) => ({ endpoint_id: seed.id, version: 1 })).sort((a, b) =>
        a.endpoint_id.localeCompare(b.endpoint_id),
      ),
    );
  });
});
