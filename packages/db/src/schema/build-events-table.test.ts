import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestDatabase, type TestDatabase } from "../testing/create-test-database";
import { tableFacts } from "../testing/table-facts";
import { accountRow, buildEventRow, buildRow } from "../testing/test-rows";
import { violatedConstraint } from "../testing/violated-constraint";
import { accounts } from "./accounts-table";
import { buildEvents } from "./build-events-table";
import { builds } from "./builds-table";

const INSERT =
  "insert into build_events (id, build_id, stage, kind, message) values ($1, $2, $3, $4, $5)";

let database: TestDatabase;

beforeEach(async () => {
  database = await createTestDatabase();
  await database.db.insert(accounts).values(accountRow());
  await database.db.insert(builds).values(buildRow());
});

afterEach(async () => {
  await database.close();
});

describe("build_events", () => {
  it("keeps the story of a build with its structured facts", async () => {
    await database.db
      .insert(buildEvents)
      .values([
        buildEventRow(),
        buildEventRow({ id: "bev_2", stage: "test", kind: "progress", detail: { run: 3 } }),
      ]);

    expect(await database.db.select().from(buildEvents)).toHaveLength(2);
  });

  it("declares what it enforces, indexes every foreign key and has row-level security", async () => {
    const facts = await tableFacts(database, buildEvents);

    expect(facts.enforcedChecks).toEqual(facts.declaredChecks);
    expect(facts.enforcedForeignKeys).toEqual(facts.declaredForeignKeys);
    expect(facts.unindexedForeignKeys).toEqual([]);
    expect(facts.rowLevelSecurity).toBe(true);
  });

  it.each([
    [
      "a stage outside the contract",
      ["bev_x", "bld_1", "repair", "started", "x"],
      "build_events_stage",
    ],
    [
      "a kind outside the contract",
      ["bev_x", "bld_1", "test", "retried", "x"],
      "build_events_kind",
    ],
    ["an empty message", ["bev_x", "bld_1", "test", "started", ""], "build_events_message_length"],
    ["an id without its prefix", ["x", "bld_1", "test", "started", "x"], "build_events_id_prefix"],
    [
      "a build that does not exist",
      ["bev_x", "bld_none", "test", "started", "x"],
      "build_events_build_id_builds_id_fk",
    ],
  ])("rejects %s", async (_case, values, constraint) => {
    expect(await violatedConstraint(database.query(INSERT, values))).toBe(constraint);
  });

  it("goes with its build", async () => {
    await database.db.insert(buildEvents).values(buildEventRow());

    await database.db.delete(builds).where(eq(builds.id, "bld_1"));

    expect(await database.db.select().from(buildEvents)).toEqual([]);
  });
});
