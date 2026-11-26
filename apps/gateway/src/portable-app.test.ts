import { recipeSchema } from "@repo/contracts/recipe/recipe-schema";
import { parseId } from "@repo/core/ids/id";
import { createFakeHttpClient } from "@repo/recipes/ports/testing/fake-http-client";
import { createFakeResolveHost } from "@repo/recipes/ports/testing/fake-resolve-host";
import { createFakeWait } from "@repo/recipes/ports/testing/fake-wait";
import { describe, expect, it } from "vitest";
import { createEngineRecipeRunner } from "./adapters/engine/engine-recipe-runner";
import { createMemoryBuildQueue } from "./adapters/memory/memory-build-queue";
import { createMemoryCatalogSearch } from "./adapters/memory/memory-catalog-search";
import { createMemoryEndpointDirectory } from "./adapters/memory/memory-endpoint-directory";
import { createMemorySourceRateLimiter } from "./adapters/memory/memory-source-rate-limiter";
import { createApp } from "./app";
import { servedEndpoint, testDeps } from "./testing/test-deps";

const SOURCE_URL = "https://api.example.org/now";

/** An endpoint with no value yet, so a call runs its recipe in the real engine. */
const PORTABLE = (() => {
  const base = servedEndpoint({ slug: "portable" });
  const document = recipeSchema.parse({
    version: 1,
    steps: [
      { id: "now", use: "http.get", url: SOURCE_URL, expect: "json" },
      { id: "out", use: "transform", expr: '{ "temperature_c": now.t }' },
    ],
    output: "out",
  });
  return { ...base, recipe: base.recipe === null ? null : { ...base.recipe, document } };
})();

/** The gateway on memory adapters and the real engine over fake HTTP: nothing of Node's. */
function portableGateway() {
  const deps = testDeps({
    endpoints: createMemoryEndpointDirectory([PORTABLE]),
    search: createMemoryCatalogSearch([PORTABLE]),
  });
  const build = parseId("build", "bld_portable");
  const runner = createEngineRecipeRunner({
    http: createFakeHttpClient({
      [SOURCE_URL]: { status: 200, contentType: "application/json", body: '{"t":3.5}' },
    }).http,
    resolveHost: createFakeResolveHost({ "api.example.org": ["93.184.216.34"] }),
    wait: createFakeWait().wait,
    userAgent: "recipe-engine/1 (+https://example.com/contact)",
    clock: deps.clock,
    limiter: createMemorySourceRateLimiter(deps.clock),
  });
  const builds = createMemoryBuildQueue(
    build.ok
      ? [
          {
            id: build.value,
            status: "queued",
            stage: null,
            progress: 0,
            endpoint: null,
            reason: null,
          },
        ]
      : [],
  );
  return createApp({ ...deps, runner, builds });
}

describe("the gateway as portable code", () => {
  it("answers every route through Web-standard Request and Response alone", async () => {
    const app = portableGateway();
    const paths = [
      "/healthz",
      "/search?q=temperature",
      "/builds/bld_portable",
      "/@core/portable",
      "/@core/portable?shape=number",
      "/@core/portable?shape=text",
      "/@core/portable?shape=csv",
      "/nowhere",
    ];

    const callAll = () =>
      Promise.all(
        paths.map(async (path) => {
          const response = await app(new Request(`https://api.example.com${path}`));
          return [response instanceof Response, response.status, await response.text()] as const;
        }),
      );
    // The lint rules keep Node modules and globals out of this code; Node's own Request and
    // Response are built on Buffer, so hiding it here would test Node, not the gateway.
    const answers = await callAll();

    expect(answers.map(([isResponse, status]) => [isResponse, status])).toEqual([
      [true, 200],
      [true, 200],
      [true, 200],
      [true, 200],
      [true, 200],
      [true, 200],
      [true, 200],
      [true, 404],
    ]);
    expect(answers[4]?.[2]).toBe("3.5");
  });
});
