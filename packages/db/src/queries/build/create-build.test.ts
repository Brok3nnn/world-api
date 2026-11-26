import { BUILD_REQUEST_EXAMPLE } from "@repo/contracts/build/examples/build-examples";
import type { AccountId, BuildId } from "@repo/core/ids/id";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { accounts } from "../../schema/accounts-table";
import { builds } from "../../schema/builds-table";
import { createTestDatabase, type TestDatabase } from "../../testing/create-test-database";
import { accountRow } from "../../testing/test-rows";
import { createBuild } from "./create-build";

// Safe: the literals have the prefix and shape of their kinds.
const BUILD = { id: "bld_1" as BuildId, requester_id: "acc_core" as AccountId };

let database: TestDatabase;

beforeEach(async () => {
  database = await createTestDatabase();
  await database.db.insert(accounts).values(accountRow());
});

afterEach(async () => {
  await database.close();
});

describe("createBuild", () => {
  it("queues a build with its request", async () => {
    expect(await createBuild(database.db, { ...BUILD, request: BUILD_REQUEST_EXAMPLE })).toEqual({
      ok: true,
      value: undefined,
    });
    expect(await database.db.select().from(builds)).toMatchObject([
      { id: "bld_1", status: "queued", request: BUILD_REQUEST_EXAMPLE },
    ]);
  });

  it("refuses a request that breaks its contract", async () => {
    const result = await createBuild(database.db, { ...BUILD, request: { text: "ab" } });

    expect(result.ok || result.error.code).toBe("invalid_request");
    expect(await database.db.select().from(builds)).toEqual([]);
  });
});
