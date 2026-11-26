import type { BuildId } from "@repo/core/ids/id";
import { addSeconds } from "@repo/core/time/duration";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { accounts } from "../../schema/accounts-table";
import { builds } from "../../schema/builds-table";
import { endpoints } from "../../schema/endpoints-table";
import { createTestDatabase, type TestDatabase } from "../../testing/create-test-database";
import { accountRow, buildRow, endpointRow } from "../../testing/test-rows";
import { claimBuild, claimNextBuild } from "./claim-build";

const NOW = new Date("2026-11-21T12:00:00Z");
const WINDOW = { now: NOW, lock_until: addSeconds(NOW, 60) };
// Safe: the literals have the prefix and shape of a build id.
const id = (value: string) => value as BuildId;

let database: TestDatabase;

beforeEach(async () => {
  database = await createTestDatabase();
  await database.db.insert(accounts).values(accountRow());
});

afterEach(async () => {
  await database.close();
});

describe("claimBuild", () => {
  beforeEach(async () => {
    await database.db.insert(builds).values(buildRow());
  });

  it("claims a queued build and starts it", async () => {
    const claimed = await claimBuild(database.db, { ...WINDOW, build_id: id("bld_1") });

    expect(claimed).toMatchObject({
      id: "bld_1",
      stage: null,
      attempt: 0,
      locked_until: WINDOW.lock_until,
    });
    expect(await database.db.select().from(builds)).toMatchObject([{ status: "running" }]);
  });

  it("lets exactly one of two runners claiming at once win", async () => {
    const claims = await Promise.all([
      claimBuild(database.db, { ...WINDOW, build_id: id("bld_1") }),
      claimBuild(database.db, { ...WINDOW, build_id: id("bld_1") }),
    ]);

    expect(claims.filter((claim) => claim !== undefined)).toHaveLength(1);
  });

  it("refuses a build whose lock is still held, until the lock expires", async () => {
    await claimBuild(database.db, { ...WINDOW, build_id: id("bld_1") });
    const later = (seconds: number) => ({
      build_id: id("bld_1"),
      now: addSeconds(NOW, seconds),
      lock_until: addSeconds(NOW, 120),
    });

    expect(await claimBuild(database.db, later(59))).toBeUndefined();
    expect(await claimBuild(database.db, later(61))).toMatchObject({ id: "bld_1" });
  });

  it.each([
    "succeeded",
    "failed",
    "rejected",
  ] as const)("never claims a %s build", async (status) => {
    await database.db.insert(endpoints).values(endpointRow());
    await database.db
      .update(builds)
      .set({ status, reason: "Ended.", endpoint_id: "ep_weather_now" })
      .where(eq(builds.id, "bld_1"));

    expect(await claimBuild(database.db, { ...WINDOW, build_id: id("bld_1") })).toBeUndefined();
  });
});

describe("claimNextBuild", () => {
  it("claims the oldest claimable build first", async () => {
    await database.db
      .insert(builds)
      .values([buildRow({ id: "bld_new" }), buildRow({ id: "bld_old" })]);
    await database.query(
      "update builds set created_at = created_at - interval '1 minute' where id = 'bld_old'",
    );

    expect(await claimNextBuild(database.db, WINDOW)).toMatchObject({ id: "bld_old" });
    expect(await claimNextBuild(database.db, WINDOW)).toMatchObject({ id: "bld_new" });
    expect(await claimNextBuild(database.db, WINDOW)).toBeUndefined();
  });

  it("picks up a build whose runner let its lock expire", async () => {
    await database.db
      .insert(builds)
      .values(buildRow({ status: "running", stage: "draft", locked_until: addSeconds(NOW, -1) }));

    expect(await claimNextBuild(database.db, WINDOW)).toMatchObject({
      id: "bld_1",
      stage: "draft",
    });
  });
});
