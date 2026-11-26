import { type Recipe, recipeSchema } from "@repo/contracts/recipe/recipe-schema";
import { err, ok } from "@repo/core/result";
import { createFakeClock } from "@repo/core/time/testing/fake-clock";
import { describe, expect, it } from "vitest";
import { chainedEndpointReader } from "../engine/chained-endpoint-reader";
import type { RunDeps } from "../engine/run-deps";
import { runRecipe } from "../engine/run-recipe";
import type { StepExecutors } from "../engine/step-executor";
import { createFakeEndpointReader } from "../ports/testing/fake-endpoint-reader";
import { createFakeSourceFetch } from "../ports/testing/fake-source-fetch";
import { endpointRead } from "./endpoint-read";
import { transform } from "./transform";

const NOW = new Date("2026-11-22T10:00:00Z");

const VALUES = {
  "@core/temperature-vienna": { temperature_c: 4.2 },
  "@core/rain-vienna": { rain_mm: 0.4 },
  "@core/eur-huf": { rate: 401.2 },
};

function deps(readEndpoint: RunDeps["readEndpoint"]): RunDeps {
  return {
    fetch: createFakeSourceFetch({}),
    readEndpoint,
    clock: createFakeClock(NOW),
  };
}

function unused(): never {
  throw new Error("This step kind is not part of the test.");
}

const EXECUTORS: StepExecutors = {
  "http.get": unused,
  transform,
  "html.select": unused,
  "text.match": unused,
  "endpoint.read": endpointRead,
};

const MIX: Recipe = recipeSchema.parse({
  version: 1,
  steps: [
    { id: "temperature", use: "endpoint.read", ref: "@core/temperature-vienna" },
    { id: "rain", use: "endpoint.read", ref: "@core/rain-vienna" },
    { id: "rate", use: "endpoint.read", ref: "@core/eur-huf" },
    { id: "mix", use: "transform", expr: "$" },
  ],
  output: "mix",
});

describe("endpointRead", () => {
  it("lets a mix recipe of three reads return one combined value", async () => {
    const run = await runRecipe(MIX, deps(createFakeEndpointReader(VALUES)), EXECUTORS);
    expect(run.result).toEqual(
      ok({
        data: {
          temperature: { temperature_c: 4.2 },
          rain: { rain_mm: 0.4 },
          rate: { rate: 401.2 },
        },
        asOf: NOW,
      }),
    );
  });

  it("fails with endpoint_unavailable when an endpoint has no value", async () => {
    const { "@core/rain-vienna": _missing, ...withoutRain } = VALUES;
    const run = await runRecipe(MIX, deps(createFakeEndpointReader(withoutRain)), EXECUTORS);
    expect(run.result).toEqual(err({ code: "endpoint_unavailable", step: "rain" }));
  });

  it("fails with limit_exceeded when a read would loop back to the endpoint being run", async () => {
    const reader = chainedEndpointReader(["@core/eur-huf"], async () => ok({}));
    const run = await runRecipe(MIX, deps(reader), EXECUTORS);
    expect(run.result).toEqual(err({ code: "limit_exceeded", step: "rate" }));
  });
});
