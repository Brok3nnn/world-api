import { buildStatusResponseSchema } from "@repo/contracts/build/build-status-response";
import { BUILD_EVENT_EXAMPLE } from "@repo/contracts/build/examples/build-report-examples";
import type { BuildEventId, BuildId, EndpointId } from "@repo/core/ids/id";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { accounts } from "../../schema/accounts-table";
import { buildEvents } from "../../schema/build-events-table";
import { builds } from "../../schema/builds-table";
import { endpoints } from "../../schema/endpoints-table";
import { createTestDatabase, type TestDatabase } from "../../testing/create-test-database";
import { accountRow, buildRow, endpointRow } from "../../testing/test-rows";
import { advanceBuild } from "./advance-build";
import { appendBuildEvent } from "./append-build-event";
import { statusesBefore } from "./build-transition";
import { finishBuild } from "./finish-build";
import { readBuildStatus } from "./read-build-status";

// Safe: the literals have the prefix and shape of their kinds.
const BUILD = "bld_1" as BuildId;
const ENDPOINT = "ep_weather_now" as EndpointId;

let database: TestDatabase;

beforeEach(async () => {
  database = await createTestDatabase();
  await database.db.insert(accounts).values(accountRow());
  await database.db.insert(endpoints).values(endpointRow());
  await database.db.insert(builds).values(buildRow({ status: "running" }));
});

afterEach(async () => {
  await database.close();
});

describe("statusesBefore", () => {
  it("takes the transitions from the core: only a running build ends, only a queued one starts", () => {
    expect(statusesBefore("succeeded")).toEqual(["running"]);
    expect(statusesBefore("running")).toEqual(["queued"]);
    expect(statusesBefore("queued")).toEqual([]);
  });
});

describe("advanceBuild", () => {
  it("records the stage, progress and attempt of a running build", async () => {
    await advanceBuild(database.db, { build_id: BUILD, stage: "draft", progress: 0.4, attempt: 2 });

    expect(await readBuildStatus(database.db, BUILD)).toMatchObject({
      stage: "draft",
      progress: 0.4,
    });
    expect(await database.db.select({ attempt: builds.attempt }).from(builds)).toEqual([
      { attempt: 2 },
    ]);
  });

  it("refuses a build that is not running", async () => {
    await finishBuild(database.db, {
      build_id: BUILD,
      outcome: { status: "rejected", reason: "No source." },
    });

    expect(
      await advanceBuild(database.db, { build_id: BUILD, stage: "test", progress: 0.5 }),
    ).toEqual({
      ok: false,
      error: { code: "not_running" },
    });
  });
});

describe("finishBuild and readBuildStatus", () => {
  it("end a build with its endpoint and describe it", async () => {
    const result = await finishBuild(database.db, {
      build_id: BUILD,
      outcome: { status: "succeeded", endpoint_id: ENDPOINT },
    });

    expect(result.ok).toBe(true);
    expect(await readBuildStatus(database.db, BUILD)).toEqual({
      id: BUILD,
      status: "succeeded",
      stage: null,
      progress: 1,
      endpoint: { owner: "core", slug: "weather-now-vienna" },
      reason: null,
    });
  });

  it("end a build with a reason and release its lock", async () => {
    await finishBuild(database.db, {
      build_id: BUILD,
      outcome: { status: "failed", reason: "The model did not answer." },
    });

    expect(await readBuildStatus(database.db, BUILD)).toMatchObject({
      endpoint: null,
      reason: "The model did not answer.",
    });
    expect(await database.db.select({ locked_until: builds.locked_until }).from(builds)).toEqual([
      { locked_until: null },
    ]);
  });

  it("refuse to change a build that already ended", async () => {
    await finishBuild(database.db, {
      build_id: BUILD,
      outcome: { status: "rejected", reason: "No source." },
    });

    const again = await finishBuild(database.db, {
      build_id: BUILD,
      outcome: { status: "succeeded", endpoint_id: ENDPOINT },
    });

    expect(again).toEqual({ ok: false, error: { code: "transition_refused" } });
    expect(await readBuildStatus(database.db, BUILD)).toMatchObject({ status: "rejected" });
  });

  it("describe a build so that it parses as the build-status contract", async () => {
    await finishBuild(database.db, {
      build_id: BUILD,
      outcome: { status: "succeeded", endpoint_id: ENDPOINT },
    });
    const status = await readBuildStatus(database.db, BUILD);

    const endpoint = status?.endpoint
      ? `https://api.example.com/@${status.endpoint.owner}/${status.endpoint.slug}`
      : null;

    expect(buildStatusResponseSchema.safeParse({ ...status, endpoint }).success).toBe(true);
  });

  it("find nothing for a build that does not exist", async () => {
    // Safe: the literal has the prefix and shape of a build id.
    expect(await readBuildStatus(database.db, "bld_none" as BuildId)).toBeUndefined();
  });
});

describe("appendBuildEvent", () => {
  it("adds an event that passes its contract", async () => {
    const { at: _at, ...event } = BUILD_EVENT_EXAMPLE;

    // Safe: the literal has the prefix and shape of a build event id.
    await appendBuildEvent(database.db, {
      id: "bev_1" as BuildEventId,
      event: { ...event, build_id: BUILD },
    });

    expect(await database.db.select().from(buildEvents)).toMatchObject([
      { kind: "progress", detail: { run: 12, of: 20 } },
    ]);
  });

  it("refuses an event with an empty message", async () => {
    // Safe: the literal has the prefix and shape of a build event id.
    const result = await appendBuildEvent(database.db, {
      id: "bev_1" as BuildEventId,
      event: { build_id: BUILD, stage: "test", kind: "progress", message: "" },
    });

    expect(result).toEqual({ ok: false, error: { code: "invalid_event" } });
  });
});
