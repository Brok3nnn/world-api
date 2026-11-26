import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestDatabase, type TestDatabase } from "../testing/create-test-database";
import { tableFacts } from "../testing/table-facts";
import { accountRow, buildRow, endpointRow } from "../testing/test-rows";
import { violatedConstraint } from "../testing/violated-constraint";
import { accounts } from "./accounts-table";
import { builds } from "./builds-table";
import { endpoints } from "./endpoints-table";

const INSERT =
  "insert into builds (id, requester_id, request, status, stage) values ($1, $2, $3, $4, $5)";

let database: TestDatabase;

beforeEach(async () => {
  database = await createTestDatabase();
  await database.db.insert(accounts).values(accountRow());
  await database.db.insert(endpoints).values(endpointRow());
});

afterEach(async () => {
  await database.close();
});

describe("builds", () => {
  it("queues a build with nothing done yet", async () => {
    await database.db.insert(builds).values(buildRow());

    const [row] = await database.db.select().from(builds);

    expect(row).toMatchObject({
      status: "queued",
      stage: null,
      progress: 0,
      attempt: 0,
      cost_micro_usd: 0,
    });
  });

  it("stores a succeeded build with its endpoint and a rejected build with its reason", async () => {
    await database.db
      .insert(builds)
      .values([
        buildRow({ status: "succeeded", progress: 1, endpoint_id: "ep_weather_now" }),
        buildRow({ id: "bld_2", status: "rejected", reason: "No approved source offers this." }),
      ]);

    expect(await database.db.select().from(builds)).toHaveLength(2);
  });

  it("declares what it enforces, indexes every foreign key and has row-level security", async () => {
    const facts = await tableFacts(database, builds);

    expect(facts.enforcedChecks).toEqual(facts.declaredChecks);
    expect(facts.enforcedForeignKeys).toEqual(facts.declaredForeignKeys);
    expect(facts.unindexedForeignKeys).toEqual([]);
    expect(facts.indexes).toContain("builds_claim_idx");
    expect(facts.rowLevelSecurity).toBe(true);
  });

  it.each([
    ["a status outside the contract", ["bld_x", "acc_core", "{}", "paused", null], "builds_status"],
    [
      "a stage outside the contract",
      ["bld_x", "acc_core", "{}", "running", "repair"],
      "builds_stage",
    ],
    ["an id without its prefix", ["x", "acc_core", "{}", "queued", null], "builds_id_prefix"],
  ])("rejects %s", async (_case, values, constraint) => {
    expect(await violatedConstraint(database.query(INSERT, values))).toBe(constraint);
  });

  it.each([
    ["a succeeded build without an endpoint", { status: "succeeded" }, "builds_outcome"],
    ["a failed build without a reason", { status: "failed" }, "builds_outcome"],
    ["progress above 1", { progress: 1.5 }, "builds_progress"],
    ["a negative cost", { cost_micro_usd: -1 }, "builds_cost"],
    [
      "a requester that does not exist",
      { requester_id: "acc_nobody" },
      "builds_requester_id_accounts_id_fk",
    ],
  ] as const)("rejects %s", async (_case, overrides, constraint) => {
    const write = database.db.insert(builds).values(buildRow(overrides));

    expect(await violatedConstraint(write)).toBe(constraint);
  });
});
