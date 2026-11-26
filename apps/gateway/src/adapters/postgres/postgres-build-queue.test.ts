import { parseId } from "@repo/core/ids/id";
import { accounts } from "@repo/db/schema/accounts-table";
import { builds } from "@repo/db/schema/builds-table";
import { createTestDatabase } from "@repo/db/testing/create-test-database";
import { accountRow, buildRow } from "@repo/db/testing/test-rows";
import { describe, expect, it } from "vitest";
import { createPostgresBuildQueue } from "./postgres-build-queue";

function buildId(value: string) {
  const id = parseId("build", value);
  if (!id.ok) {
    throw new Error(`${value} is not a build id.`);
  }
  return id.value;
}

describe("createPostgresBuildQueue", () => {
  it("reads how a build stands, and null for a build that does not exist", async () => {
    const database = await createTestDatabase();
    await database.db.insert(accounts).values(accountRow());
    await database.db.insert(builds).values(buildRow());
    const queue = createPostgresBuildQueue(database.db);

    expect(await queue.status(buildId("bld_1"))).toEqual({
      id: "bld_1",
      status: "queued",
      stage: null,
      progress: 0,
      endpoint: null,
      reason: null,
    });
    expect(await queue.status(buildId("bld_unknown"))).toBeNull();
    await database.close();
  });
});
