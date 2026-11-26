import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestDatabase, type TestDatabase } from "../testing/create-test-database";
import { tableFacts } from "../testing/table-facts";
import { violatedConstraint } from "../testing/violated-constraint";
import { accounts } from "./accounts-table";

const INSERT = "insert into accounts (id, handle, display_name, kind) values ($1, $2, $3, $4)";
const CORE = { id: "acc_core", handle: "core", display_name: "Core", kind: "platform" } as const;

let database: TestDatabase;

beforeEach(async () => {
  database = await createTestDatabase();
});

afterEach(async () => {
  await database.close();
});

describe("accounts", () => {
  it("stores an account and sets both timestamps", async () => {
    await database.db.insert(accounts).values(CORE);

    const [row] = await database.db.select().from(accounts);

    expect(row).toMatchObject({ ...CORE, auth_user_id: null });
    expect(row?.created_at).toBeInstanceOf(Date);
    expect(row?.updated_at).toBeInstanceOf(Date);
  });

  it("rejects a second account with the same handle", async () => {
    await database.db.insert(accounts).values(CORE);

    const write = database.db.insert(accounts).values({ ...CORE, id: "acc_other" });

    expect(await violatedConstraint(write)).toBe("accounts_handle_unique");
  });

  it("rejects a kind that is not platform or user", async () => {
    const write = database.query(INSERT, ["acc_robot", "robot", "Robot", "robot"]);

    expect(await violatedConstraint(write)).toBe("accounts_kind");
  });

  it.each(["Core", "a", "my-team", "a".repeat(33)])("rejects the handle %j", async (handle) => {
    const write = database.query(INSERT, ["acc_x", handle, "X", "user"]);

    expect(await violatedConstraint(write)).toBe("accounts_handle_format");
  });

  it.each(["core", "ep_core", "acc_Core"])("rejects the id %j", async (id) => {
    const write = database.query(INSERT, [id, "core", "Core", "platform"]);

    expect(await violatedConstraint(write)).toBe("accounts_id_prefix");
  });

  it("links each sign-in identity to at most one account", async () => {
    const auth_user_id = "00000000-0000-4000-8000-000000000001";
    await database.db.insert(accounts).values({ ...CORE, auth_user_id });

    const write = database.db
      .insert(accounts)
      .values({ id: "acc_mira", handle: "mira", display_name: "Mira", kind: "user", auth_user_id });

    expect(await violatedConstraint(write)).toBe("accounts_auth_user_id_unique");
  });

  it("allows many accounts without a sign-in identity", async () => {
    await database.db.insert(accounts).values(CORE);
    await database.db
      .insert(accounts)
      .values({ id: "acc_lab", handle: "lab", display_name: "Lab", kind: "platform" });

    expect(await database.db.select().from(accounts)).toHaveLength(2);
  });

  it("declares the checks it enforces and has row-level security", async () => {
    const facts = await tableFacts(database, accounts);

    expect(facts.enforcedChecks).toEqual(facts.declaredChecks);
    expect(facts.constraints).toContain("accounts_handle_unique");
    expect(facts.rowLevelSecurity).toBe(true);
  });
});
