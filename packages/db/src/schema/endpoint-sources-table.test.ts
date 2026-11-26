import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestDatabase, type TestDatabase } from "../testing/create-test-database";
import { tableFacts } from "../testing/table-facts";
import { accountRow, endpointRow, sourceRow } from "../testing/test-rows";
import { violatedConstraint } from "../testing/violated-constraint";
import { accounts } from "./accounts-table";
import { endpointSources } from "./endpoint-sources-table";
import { endpoints } from "./endpoints-table";
import { sources } from "./sources-table";

const LINK = { endpoint_id: "ep_weather_now", source_id: "src_weather" };

let database: TestDatabase;

beforeEach(async () => {
  database = await createTestDatabase();
  await database.db.insert(accounts).values(accountRow());
  await database.db.insert(endpoints).values(endpointRow());
  await database.db.insert(sources).values(sourceRow());
});

afterEach(async () => {
  await database.close();
});

describe("endpoint_sources", () => {
  it("links an endpoint to a source once", async () => {
    await database.db.insert(endpointSources).values(LINK);

    expect(await violatedConstraint(database.db.insert(endpointSources).values(LINK))).toBe(
      "endpoint_sources_endpoint_id_source_id_pk",
    );
  });

  it("declares what it enforces, indexes every foreign key and has row-level security", async () => {
    const facts = await tableFacts(database, endpointSources);

    expect(facts.enforcedForeignKeys).toEqual(facts.declaredForeignKeys);
    expect(facts.unindexedForeignKeys).toEqual([]);
    expect(facts.rowLevelSecurity).toBe(true);
  });

  it("rejects a source that does not exist", async () => {
    const write = database.db.insert(endpointSources).values({ ...LINK, source_id: "src_none" });

    expect(await violatedConstraint(write)).toBe("endpoint_sources_source_id_sources_id_fk");
  });

  it("keeps a source that an endpoint uses", async () => {
    await database.db.insert(endpointSources).values(LINK);

    const remove = database.db.delete(sources).where(eq(sources.id, "src_weather"));

    expect(await violatedConstraint(remove)).toBe("endpoint_sources_source_id_sources_id_fk");
  });

  it("goes with its endpoint", async () => {
    await database.db.insert(endpointSources).values(LINK);

    await database.db.delete(endpoints).where(eq(endpoints.id, "ep_weather_now"));

    expect(await database.db.select().from(endpointSources)).toEqual([]);
  });
});

describe("schema version 1", () => {
  it("has its ten tables, all with row-level security", async () => {
    const tables = await database.query(
      "select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename",
    );

    expect(tables).toHaveLength(10);
    expect(tables.filter((table) => table.rowsecurity !== true)).toEqual([]);
  });
});
