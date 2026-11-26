import { recipeSchema } from "@repo/contracts/recipe/recipe-schema";
import { err, ok } from "@repo/core/result";
import { createFakeClock } from "@repo/core/time/testing/fake-clock";
import { createFakeEndpointReader } from "@repo/recipes/ports/testing/fake-endpoint-reader";
import { createFakeHttpClient } from "@repo/recipes/ports/testing/fake-http-client";
import { createFakeResolveHost } from "@repo/recipes/ports/testing/fake-resolve-host";
import { createFakeWait } from "@repo/recipes/ports/testing/fake-wait";
import { describe, expect, it } from "vitest";
import { servedEndpoint } from "../../testing/test-deps";
import { createMemorySourceRateLimiter } from "../memory/memory-source-rate-limiter";
import { createEngineRecipeRunner } from "./engine-recipe-runner";

const NOW = new Date("2026-11-22T10:00:00.000Z");
const URL_NOW = "https://api.example.org/v1/now";
/** The test endpoint's weather source, on `api.example.org`, at 60 requests a minute. */
const SOURCES = servedEndpoint().sources;
const NO_READS = createFakeEndpointReader({});

const RECIPE = recipeSchema.parse({
  version: 1,
  steps: [
    { id: "now", use: "http.get", url: URL_NOW, expect: "json" },
    { id: "out", use: "transform", expr: '{ "temperature_c": now.t }' },
  ],
  output: "out",
});

function runner() {
  const client = createFakeHttpClient({
    [URL_NOW]: { status: 200, contentType: "application/json", body: '{"t":4.2}' },
  });
  const engine = createEngineRecipeRunner({
    http: client.http,
    resolveHost: createFakeResolveHost({ "api.example.org": ["93.184.216.34"] }),
    wait: createFakeWait().wait,
    userAgent: "recipe-engine/1 (+https://example.com/contact)",
    clock: createFakeClock(NOW),
    limiter: createMemorySourceRateLimiter(createFakeClock(NOW)),
  });
  return { engine, client };
}

describe("createEngineRecipeRunner", () => {
  it("runs a recipe through the egress policy with every step kind available", async () => {
    const { engine, client } = runner();

    expect(await engine.run({ recipe: RECIPE, sources: SOURCES, readEndpoint: NO_READS })).toEqual(
      ok({ data: { temperature_c: 4.2 }, asOf: NOW }),
    );
    expect(client.requests[0]?.headers["user-agent"]).toBe(
      "recipe-engine/1 (+https://example.com/contact)",
    );
  });

  it("sends nothing once the source has used its requests of the minute", async () => {
    const { engine, client } = runner();
    const slow = SOURCES.map((source) => ({ ...source, rateLimitPerMin: 1 }));

    await engine.run({ recipe: RECIPE, sources: slow, readEndpoint: NO_READS });

    expect(await engine.run({ recipe: RECIPE, sources: slow, readEndpoint: NO_READS })).toEqual(
      err({ code: "policy_denied", step: "now" }),
    );
    expect(client.requests).toHaveLength(1);
  });

  it("fetches from no host outside the run's allow-list", async () => {
    const { engine, client } = runner();

    expect(await engine.run({ recipe: RECIPE, sources: [], readEndpoint: NO_READS })).toEqual(
      err({ code: "policy_denied", step: "now" }),
    );
    expect(client.requests).toEqual([]);
  });
});
