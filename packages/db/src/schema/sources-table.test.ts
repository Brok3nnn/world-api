import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestDatabase, type TestDatabase } from "../testing/create-test-database";
import { tableFacts } from "../testing/table-facts";
import { sourceRow } from "../testing/test-rows";
import { violatedConstraint } from "../testing/violated-constraint";
import { sources } from "./sources-table";

let database: TestDatabase;

beforeEach(async () => {
  database = await createTestDatabase();
});

afterEach(async () => {
  await database.close();
});

describe("sources", () => {
  it("stores a source with its hosts and capabilities", async () => {
    await database.db.insert(sources).values(sourceRow());

    const [row] = await database.db.select().from(sources);

    expect(row).toMatchObject(sourceRow());
  });

  it("declares what it enforces and has row-level security", async () => {
    const facts = await tableFacts(database, sources);

    expect(facts.enforcedChecks).toEqual(facts.declaredChecks);
    expect(facts.constraints).toContain("sources_name_unique");
    expect(facts.rowLevelSecurity).toBe(true);
  });

  it.each([
    ["an id without its prefix", { id: "weather" }, "sources_id_prefix"],
    ["no hosts", { hosts: [] }, "sources_hosts"],
    [
      "eleven hosts",
      { hosts: Array.from({ length: 11 }, (_, i) => `h${i}.example.org`) },
      "sources_hosts",
    ],
    ["documentation that is not https", { docs_url: "http://example.org" }, "sources_https"],
    ["evidence that is not https", { evidence_url: "http://example.org" }, "sources_https"],
    ["a rate limit of zero", { rate_limit_per_min: 0 }, "sources_rate_limit"],
  ])("rejects %s", async (_case, overrides, constraint) => {
    const write = database.db.insert(sources).values(sourceRow(overrides));

    expect(await violatedConstraint(write)).toBe(constraint);
  });

  it("rejects a tier the contract does not list", async () => {
    await database.db.insert(sources).values(sourceRow());

    const write = database.query("update sources set tier = 'amber'");

    expect(await violatedConstraint(write)).toBe("sources_tier");
  });

  it("rejects a second source with the same name", async () => {
    await database.db.insert(sources).values(sourceRow());

    const write = database.db.insert(sources).values(sourceRow({ id: "src_again" }));

    expect(await violatedConstraint(write)).toBe("sources_name_unique");
  });
});
