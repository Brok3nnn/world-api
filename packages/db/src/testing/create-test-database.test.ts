import { afterEach, describe, expect, it } from "vitest";
import { accounts } from "../schema/accounts-table";
import { createTestDatabase, type TestDatabase } from "./create-test-database";

const opened: TestDatabase[] = [];

async function open(): Promise<TestDatabase> {
  const database = await createTestDatabase();
  opened.push(database);
  return database;
}

afterEach(async () => {
  await Promise.all(opened.splice(0).map((database) => database.close()));
});

const CORE = { id: "acc_core", handle: "core", display_name: "Core", kind: "platform" } as const;

describe("createTestDatabase", () => {
  it("runs SQL with bound parameters", async () => {
    const { query } = await open();

    expect(await query("select $1::int + $2::int as sum", [2, 3])).toEqual([{ sum: 5 }]);
  });

  it("is a real Postgres", async () => {
    const { query } = await open();

    const [row] = await query("select current_setting('server_version_num')::int as v");

    expect(row?.v).toBeGreaterThanOrEqual(150_000);
  });

  it("applies every migration before the test starts", async () => {
    const { query } = await open();

    const tables = await query(
      "select table_name from information_schema.tables where table_schema = 'public'",
    );

    expect(tables).toContainEqual({ table_name: "accounts" });
  });

  it("gives two databases created in one test no shared state", async () => {
    const first = await open();
    const second = await open();

    await first.db.insert(accounts).values(CORE);

    expect(await first.db.select().from(accounts)).toHaveLength(1);
    expect(await second.db.select().from(accounts)).toEqual([]);
  });

  it("cannot be used after it is closed", async () => {
    const database = await createTestDatabase();

    await database.close();

    await expect(database.query("select 1")).rejects.toThrow();
  });
});
