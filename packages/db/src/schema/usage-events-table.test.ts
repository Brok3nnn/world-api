import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestDatabase, type TestDatabase } from "../testing/create-test-database";
import { tableFacts } from "../testing/table-facts";
import { accountRow, endpointRow, usageEventRow } from "../testing/test-rows";
import { violatedConstraint } from "../testing/violated-constraint";
import { accounts } from "./accounts-table";
import { endpoints } from "./endpoints-table";
import { usageEvents } from "./usage-events-table";

const INSERT =
  "insert into usage_events (id, endpoint_id, outcome, shape, price_credits, latency_ms, refreshed) values ($1, $2, $3, $4, $5, $6, $7)";

let database: TestDatabase;

beforeEach(async () => {
  database = await createTestDatabase();
  await database.db.insert(accounts).values(accountRow());
  await database.db.insert(endpoints).values(endpointRow());
});

afterEach(async () => {
  await database.close();
});

describe("usage_events", () => {
  it("stores an anonymous call and a call by an account", async () => {
    await database.db
      .insert(usageEvents)
      .values([
        usageEventRow(),
        usageEventRow({ id: "use_2", caller_id: "acc_core", outcome: "rate_limited" }),
      ]);

    expect(await database.db.select().from(usageEvents)).toHaveLength(2);
  });

  it("declares what it enforces, has its index and row-level security", async () => {
    const facts = await tableFacts(database, usageEvents);

    expect(facts.enforcedChecks).toEqual(facts.declaredChecks);
    expect(facts.enforcedForeignKeys).toEqual(facts.declaredForeignKeys);
    expect(facts.unindexedForeignKeys).toEqual([]);
    expect(facts.indexes).toContain("usage_events_endpoint_created_idx");
    expect(facts.rowLevelSecurity).toBe(true);
  });

  it.each([
    [
      "an outcome that is neither served nor an error code",
      ["use_x", "ep_weather_now", "teapot", "json", 1, 5, false],
      "usage_events_outcome",
    ],
    [
      "a shape the contract does not list",
      ["use_x", "ep_weather_now", "served", "xml", 1, 5, false],
      "usage_events_shape",
    ],
    [
      "a negative price",
      ["use_x", "ep_weather_now", "served", "json", -1, 5, false],
      "usage_events_price_credits",
    ],
    [
      "a negative latency",
      ["use_x", "ep_weather_now", "served", "json", 1, -5, false],
      "usage_events_latency_ms",
    ],
    [
      "an id without its prefix",
      ["1", "ep_weather_now", "served", "json", 1, 5, false],
      "usage_events_id_prefix",
    ],
  ])("rejects %s", async (_case, values, constraint) => {
    expect(await violatedConstraint(database.query(INSERT, values))).toBe(constraint);
  });

  it("keeps an endpoint that has been called", async () => {
    await database.db.insert(usageEvents).values(usageEventRow());

    const remove = database.db.delete(endpoints).where(eq(endpoints.id, "ep_weather_now"));

    expect(await violatedConstraint(remove)).toBe("usage_events_endpoint_id_endpoints_id_fk");
  });
});
