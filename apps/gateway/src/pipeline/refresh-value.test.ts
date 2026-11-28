import { createRecordingLogger } from "@repo/core/log/testing/recording-logger";
import { err, ok } from "@repo/core/result";
import { createFakeEndpointReader } from "@repo/recipes/ports/testing/fake-endpoint-reader";
import { describe, expect, it } from "vitest";
import { createMemoryEndpointStatusStore } from "../adapters/memory/memory-endpoint-status-store";
import { createMemoryValueStore } from "../adapters/memory/memory-value-store";
import type { GatewayDeps } from "../gateway-deps";
import { createFakeRecipeRunner } from "../ports/testing/fake-recipe-runner";
import { servedEndpoint, storedValue, testDeps, valuesWith } from "../testing/test-deps";
import { readValue } from "./read-value";
import { refreshValue } from "./refresh-value";

const FAILING = createFakeRecipeRunner(err({ code: "fetch_failed", step: "now" }));
const NOTHING = { value: null, consecutiveFailures: 0 };

/** The gateway's test ports, and a run that reads no other endpoint. */
function refreshDeps(overrides: Partial<GatewayDeps> = {}) {
  return { ...testDeps(overrides), readEndpoint: createFakeEndpointReader({}) };
}

describe("refreshValue", () => {
  it("runs the recipe once with the usable hosts, then stores the value and its history", async () => {
    const runner = createFakeRecipeRunner();
    const values = valuesWith(storedValue(900));
    const deps = refreshDeps({ runner, values });

    const refreshed = await refreshValue(servedEndpoint(), NOTHING, deps);

    expect(refreshed.ok && refreshed.value.data).toEqual({ temperature_c: 5.1 });
    expect(runner.runs.map((run) => run.sources.flatMap((source) => source.hosts))).toEqual([
      ["api.example.org"],
    ]);
    expect(await readValue(servedEndpoint(), undefined, deps)).toEqual({
      fresh: true,
      value: refreshed.ok ? refreshed.value : null,
    });
    expect(values.history.map((entry) => entry.data)).toEqual([{ temperature_c: 5.1 }]);
  });

  it("serves the stored value within its grace period, counting and logging the failure", async () => {
    const values = valuesWith(storedValue(3_599));
    const logger = createRecordingLogger();
    const latest = await values.readLatest(servedEndpoint().id);

    const refreshed = await refreshValue(
      servedEndpoint(),
      latest,
      refreshDeps({ runner: FAILING, values, logger }),
    );

    expect(refreshed).toEqual(ok(storedValue(3_599)));
    expect((await values.readLatest(servedEndpoint().id)).consecutiveFailures).toBe(1);
    expect(logger.entries).toEqual([
      {
        level: "info",
        event: "refresh.failed",
        fields: {
          endpoint_id: "ep_weather_now_vienna",
          error: "fetch_failed at now",
          consecutive_failures: 1,
        },
      },
    ]);
  });

  it.each([
    ["the stored value is past its grace period", 3_600],
    ["there is no stored value", null],
  ])("answers 503 degraded, never charged, when %s", async (_case, ageS) => {
    const values = ageS === null ? createMemoryValueStore() : valuesWith(storedValue(ageS));
    const latest = await values.readLatest(servedEndpoint().id);

    const refreshed = await refreshValue(
      servedEndpoint(),
      latest,
      refreshDeps({ runner: FAILING, values }),
    );

    expect(refreshed.ok ? null : refreshed.error).toMatchObject({
      code: "degraded",
      retryAfterS: 900,
    });
  });

  it("says that retrying does not help when a source's terms check is over 90 days old", async () => {
    const endpoint = servedEndpoint();
    const lapsed = {
      ...endpoint,
      sources: endpoint.sources.map((source) => ({
        ...source,
        policyCheckedAt: new Date("2026-08-01T00:00:00Z"),
      })),
    };

    const refreshed = await refreshValue(lapsed, NOTHING, refreshDeps({ runner: FAILING }));

    expect(refreshed.ok ? null : refreshed.error).toMatchObject({
      code: "degraded",
      message: "A source of this endpoint may not be read, and no acceptable value exists.",
      retryAfterS: 900,
    });
  });

  it("neither stores nor returns a value the firewall refuses, and counts it as a failure", async () => {
    const runner = createFakeRecipeRunner(
      ok({ data: { temperature_c: "warm" }, asOf: new Date() }),
    );
    const values = createMemoryValueStore();

    expect(
      (await refreshValue(servedEndpoint(), NOTHING, refreshDeps({ runner, values }))).ok,
    ).toBe(false);
    expect(await values.readLatest(servedEndpoint().id)).toEqual({
      value: null,
      consecutiveFailures: 1,
    });
    expect(values.history).toEqual([]);
  });

  it("runs nothing for an endpoint without an active recipe, and counts it as a failure", async () => {
    const runner = createFakeRecipeRunner();
    const values = createMemoryValueStore();

    const refreshed = await refreshValue(
      { ...servedEndpoint(), recipe: null },
      NOTHING,
      refreshDeps({ runner, values }),
    );

    expect(refreshed.ok).toBe(false);
    expect(runner.runs).toEqual([]);
    expect((await values.readLatest(servedEndpoint().id)).consecutiveFailures).toBe(1);
  });
});

describe("refreshValue moving the endpoint", () => {
  const ID = servedEndpoint().id;

  it("degrades a live endpoint at the third failure in a row, and logs the move", async () => {
    const values = createMemoryValueStore(
      new Map([[ID, { value: storedValue(3_599), consecutiveFailures: 2 }]]),
    );
    const statuses = createMemoryEndpointStatusStore([[ID, "live"]]);
    const logger = createRecordingLogger();

    await refreshValue(
      servedEndpoint(),
      await values.readLatest(ID),
      refreshDeps({ runner: FAILING, values, statuses, logger }),
    );

    expect(logger.entries.map((entry) => entry.event)).toEqual([
      "refresh.failed",
      "endpoint.status.changed",
    ]);
    expect(await statuses.move(ID, "degraded", "live")).toBe(true);
  });

  it("keeps a live endpoint live at its first and second failures", async () => {
    const statuses = createMemoryEndpointStatusStore([[ID, "live"]]);

    await refreshValue(servedEndpoint(), NOTHING, refreshDeps({ runner: FAILING, statuses }));

    expect(await statuses.move(ID, "live", "degraded")).toBe(true);
  });

  it("makes a degraded endpoint live again with the next success", async () => {
    const statuses = createMemoryEndpointStatusStore([[ID, "degraded"]]);

    await refreshValue(servedEndpoint({ status: "degraded" }), NOTHING, refreshDeps({ statuses }));

    expect(await statuses.move(ID, "live", "degraded")).toBe(true);
  });
});
