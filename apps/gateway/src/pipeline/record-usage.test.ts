import { OUTPUT_SPEC_EXAMPLE } from "@repo/contracts/endpoint/examples/output-spec-example";
import { createRecordingLogger } from "@repo/core/log/testing/recording-logger";
import { err } from "@repo/core/result";
import { describe, expect, it } from "vitest";
import { createMemoryEndpointDirectory } from "../adapters/memory/memory-endpoint-directory";
import { createMemoryUsageSink } from "../adapters/memory/memory-usage-sink";
import { createApp } from "../app";
import type { GatewayDeps } from "../gateway-deps";
import { createFakeRecipeRunner } from "../ports/testing/fake-recipe-runner";
import type { UsageSink } from "../ports/usage-sink";
import { servedEndpoint, storedValue, testDeps, valuesWith } from "../testing/test-deps";

const ENDPOINT = "https://api.example.com/@core/weather-now-vienna";

async function callWith(query: string, overrides: Partial<GatewayDeps> = {}) {
  const usage = createMemoryUsageSink();
  const app = createApp(testDeps({ usage, values: valuesWith(storedValue(60)), ...overrides }));
  const response = await app(new Request(`${ENDPOINT}${query}`));
  await Promise.resolve();
  return { response, events: usage.events };
}

describe("recordUsage", () => {
  const FAILING = createFakeRecipeRunner(err({ code: "fetch_failed", step: "now" }));

  const SERVED = { outcome: "served", priceCredits: 1, refreshed: false };
  const STALE = { values: valuesWith(storedValue(900)) };
  const DEGRADED = { values: valuesWith(storedValue(3_600)), runner: FAILING };
  const { sentence: _sentence, ...WITHOUT_SENTENCE } = OUTPUT_SPEC_EXAMPLE;
  const NO_TEXT = {
    endpoints: createMemoryEndpointDirectory([servedEndpoint({ output_spec: WITHOUT_SENTENCE })]),
  };

  it.each([
    ["a served value", { query: "", deps: {} }, SERVED],
    ["a refreshed value", { query: "", deps: STALE }, { ...SERVED, refreshed: true }],
    [
      "a call over its max_price",
      { query: "?max_price=0", deps: {} },
      { ...SERVED, outcome: "payment_required", priceCredits: 0 },
    ],
    [
      "a shape it cannot answer",
      { query: "?shape=text", deps: NO_TEXT },
      { ...SERVED, outcome: "invalid_request", priceCredits: 0 },
    ],
    [
      "a degraded endpoint",
      { query: "", deps: DEGRADED },
      { outcome: "degraded", priceCredits: 0, refreshed: true },
    ],
  ])("records %s as one event", async (_case, call, expected) => {
    const { events } = await callWith(call.query, call.deps);

    expect(
      events.map(({ outcome, priceCredits, refreshed }) => ({ outcome, priceCredits, refreshed })),
    ).toEqual([expected]);
    expect(events[0]).toMatchObject({
      endpointId: "ep_weather_now_vienna",
      callerId: null,
      latencyMs: 0,
    });
  });

  it.each([
    ["an unknown endpoint", "https://api.example.com/@core/unknown"],
    ["a malformed call", `${ENDPOINT}?city=vienna`],
  ])("records nothing for %s, which names no endpoint", async (_case, url) => {
    const usage = createMemoryUsageSink();
    await createApp(testDeps({ usage }))(new Request(url));

    expect(usage.events).toEqual([]);
  });

  it("answers as usual when usage cannot be written, logging it once", async () => {
    const logger = createRecordingLogger();
    const failing: UsageSink = { record: async () => err({ code: "unrecorded" }) };

    const { response } = await callWith("", { usage: failing, logger });

    expect(response.status).toBe(200);
    expect(logger.entries).toEqual([
      {
        level: "warn",
        event: "usage.unrecorded",
        fields: { endpoint_id: "ep_weather_now_vienna", outcome: "served" },
      },
    ]);
  });

  it("never makes the response wait for usage to be written", async () => {
    const stuck: UsageSink = { record: () => new Promise(() => undefined) };

    expect((await callWith("", { usage: stuck })).response.status).toBe(200);
  });
});
