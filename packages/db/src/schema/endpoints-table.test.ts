import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestDatabase, type TestDatabase } from "../testing/create-test-database";
import { tableFacts } from "../testing/table-facts";
import { accountRow, endpointRow } from "../testing/test-rows";
import { violatedConstraint } from "../testing/violated-constraint";
import { accounts } from "./accounts-table";
import { endpoints } from "./endpoints-table";

let database: TestDatabase;

beforeEach(async () => {
  database = await createTestDatabase();
  await database.db.insert(accounts).values(accountRow());
});

afterEach(async () => {
  await database.close();
});

/** Inserts the valid endpoint with one column set to a raw value, bypassing the types. */
function insertWith(column: string, value: unknown) {
  const row: Record<string, unknown> = { ...endpointRow(), [column]: value };
  const columns = Object.keys(row);
  const values = columns.map((name) =>
    name === "output_spec" ? JSON.stringify(row[name]) : row[name],
  );
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
  return database.query(
    `insert into endpoints (${columns.join(", ")}) values (${placeholders})`,
    values,
  );
}

describe("endpoints", () => {
  it("stores an endpoint with its output spec as JSON", async () => {
    await database.db.insert(endpoints).values(endpointRow());

    const [row] = await database.db.select().from(endpoints);

    expect(row).toMatchObject(endpointRow());
    expect(row?.created_at).toBeInstanceOf(Date);
  });

  it("declares the checks it enforces, its indexes and row-level security", async () => {
    const facts = await tableFacts(database, endpoints);

    expect(facts.enforcedChecks).toEqual(facts.declaredChecks);
    expect(facts.enforcedForeignKeys).toEqual(facts.declaredForeignKeys);
    expect(facts.unindexedForeignKeys).toEqual([]);
    expect(facts.constraints).toContain("endpoints_owner_slug_unique");
    expect(facts.indexes).toContain("endpoints_catalog_idx");
    expect(facts.rowLevelSecurity).toBe(true);
  });

  it("rejects a second endpoint with the same slug for the same owner", async () => {
    await database.db.insert(endpoints).values(endpointRow());

    const write = database.db.insert(endpoints).values(endpointRow({ id: "ep_other" }));

    expect(await violatedConstraint(write)).toBe("endpoints_owner_slug_unique");
  });

  it("allows the same slug for another owner", async () => {
    await database.db.insert(accounts).values(accountRow({ id: "acc_lab", handle: "lab" }));
    await database.db.insert(endpoints).values(endpointRow());

    await database.db.insert(endpoints).values(endpointRow({ id: "ep_lab", owner_id: "acc_lab" }));

    expect(await database.db.select().from(endpoints)).toHaveLength(2);
  });

  it("rejects an owner that does not exist", async () => {
    const write = database.db.insert(endpoints).values(endpointRow({ owner_id: "acc_nobody" }));

    expect(await violatedConstraint(write)).toBe("endpoints_owner_id_accounts_id_fk");
  });

  it("keeps an account that still owns endpoints", async () => {
    await database.db.insert(endpoints).values(endpointRow());

    const remove = database.db.delete(accounts).where(eq(accounts.id, "acc_core"));

    expect(await violatedConstraint(remove)).toBe("endpoints_owner_id_accounts_id_fk");
  });

  it.each([
    ["category", "sports"],
    ["visibility", "hidden"],
    ["status", "paused"],
    ["method", "guessed"],
    ["freshness", "30s"],
  ])("rejects the %s %j, which the contract does not list", async (column, value) => {
    expect(await violatedConstraint(insertWith(column, value))).toBe(`endpoints_${column}`);
  });

  it.each([
    ["id", "core_weather", "endpoints_id_prefix"],
    ["slug", "weather_now", "endpoints_slug_format"],
    ["slug", "a".repeat(65), "endpoints_slug_format"],
    ["title", "", "endpoints_title_length"],
    ["summary", "a".repeat(281), "endpoints_summary_length"],
    ["price_credits", -1, "endpoints_price_credits"],
  ])("rejects the %s %j", async (column, value, constraint) => {
    expect(await violatedConstraint(insertWith(column, value))).toBe(constraint);
  });
});
