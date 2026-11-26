import { envelopeSchema } from "@repo/contracts/api/envelope";
import { recipeSchema } from "@repo/contracts/recipe/recipe-schema";
import { createRecordingLogger } from "@repo/core/log/testing/recording-logger";
import { createFakeHttpClient } from "@repo/recipes/ports/testing/fake-http-client";
import { createFakeResolveHost } from "@repo/recipes/ports/testing/fake-resolve-host";
import { createFakeWait } from "@repo/recipes/ports/testing/fake-wait";
import { describe, expect, it } from "vitest";
import { createEngineRecipeRunner } from "../adapters/engine/engine-recipe-runner";
import { createMemoryEndpointDirectory } from "../adapters/memory/memory-endpoint-directory";
import { createMemorySourceRateLimiter } from "../adapters/memory/memory-source-rate-limiter";
import { createMemoryValueStore } from "../adapters/memory/memory-value-store";
import { createApp } from "../app";
import type { ServedEndpoint } from "../ports/endpoint-directory";
import { servedEndpoint, storedValue, testDeps } from "../testing/test-deps";

const URL_A = "https://api.example.org/a";

/** An endpoint of the fakes with its own recipe; any value with `temperature_c` passes its spec. */
function endpoint(
  slug: string,
  steps: unknown[],
  outputSpec?: ServedEndpoint["definition"]["output_spec"],
): ServedEndpoint {
  const base = servedEndpoint({
    slug,
    ...(outputSpec === undefined ? {} : { output_spec: outputSpec }),
  });
  const document = recipeSchema.parse({ version: 1, steps, output: "out" });
  return { ...base, recipe: base.recipe === null ? null : { ...base.recipe, document } };
}

const read = (ref: string) => ({
  id: ref.slice(6).replaceAll("-", "_"),
  use: "endpoint.read",
  ref,
});
const pass = (expr: string) => ({ id: "out", use: "transform", expr });

const A = endpoint("temperature-a", [
  { id: "a", use: "http.get", url: URL_A, expect: "json" },
  pass('{ "temperature_c": a.t }'),
]);
const B = endpoint("temperature-b", [pass('{ "temperature_c": 1 }')]);
const MIX = endpoint("mix", [
  read("@core/temperature-a"),
  read("@core/temperature-b"),
  pass('{ "temperature_c": temperature_a.temperature_c + temperature_b.temperature_c }'),
]);
const SELF = endpoint("self", [read("@core/self"), pass('{ "temperature_c": 0 }')]);
const READS_UNKNOWN = endpoint("reads-unknown", [
  read("@core/unknown"),
  pass('{ "temperature_c": 0 }'),
]);
const deep = (slug: string, next: string) =>
  endpoint(slug, [read(`@core/${next}`), pass('{ "temperature_c": 0 }')]);

function gateway() {
  const client = createFakeHttpClient({
    [URL_A]: { status: 200, contentType: "application/json", body: '{"t":4}' },
  });
  const deps = testDeps({ logger: createRecordingLogger() });
  const values = createMemoryValueStore(
    new Map([
      [A.id, { value: storedValue(900), consecutiveFailures: 0 }],
      [B.id, { value: storedValue(60), consecutiveFailures: 0 }],
    ]),
  );
  const runner = createEngineRecipeRunner({
    http: client.http,
    resolveHost: createFakeResolveHost({ "api.example.org": ["93.184.216.34"] }),
    wait: createFakeWait().wait,
    userAgent: "recipe-engine/1 (+https://example.com/contact)",
    clock: deps.clock,
    limiter: createMemorySourceRateLimiter(deps.clock),
  });
  const endpoints = createMemoryEndpointDirectory([
    A,
    B,
    MIX,
    SELF,
    READS_UNKNOWN,
    deep("d-1", "d-2"),
    deep("d-2", "d-3"),
    deep("d-3", "d-4"),
    deep("d-4", "temperature-b"),
  ]);
  const logger = createRecordingLogger();
  const app = createApp({ ...deps, values, runner, endpoints, logger });
  const call = (slug: string) => app(new Request(`https://api.example.com/@core/${slug}`));
  return { call, client, logger };
}

describe("mixReader", () => {
  it("reads each endpoint of a mix through the pipeline, refreshing a stale one", async () => {
    const { call, client } = gateway();

    const response = await call("mix");

    // A is refreshed to 4; B is fresh and served as stored, 4.2.
    expect(envelopeSchema.parse(await response.json()).data).toEqual({ temperature_c: 8.2 });
    expect(client.requests.map((request) => request.url)).toEqual([URL_A]);
  });

  it.each([
    ["reads itself", "self"],
    ["nests three levels deep", "d-1"],
  ])("refuses a mix that %s with limit_exceeded", async (_case, slug) => {
    const { call, logger } = gateway();

    expect((await call(slug)).status).toBe(503);
    expect(
      logger.entries.some((entry) => String(entry.fields.error).startsWith("limit_exceeded")),
    ).toBe(true);
  });

  it("gives a mix endpoint_unavailable for an endpoint that cannot answer", async () => {
    const { call, logger } = gateway();

    expect((await call("reads-unknown")).status).toBe(503);
    expect(logger.entries.map((entry) => entry.fields.error)).toEqual([
      "endpoint_unavailable at unknown",
    ]);
  });
});
