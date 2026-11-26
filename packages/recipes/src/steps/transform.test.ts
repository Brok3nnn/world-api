import { type Recipe, recipeSchema } from "@repo/contracts/recipe/recipe-schema";
import { err, ok } from "@repo/core/result";
import { createFakeClock, type FakeClock } from "@repo/core/time/testing/fake-clock";
import { describe, expect, it } from "vitest";
import type { RunDeps } from "../engine/run-deps";
import { runRecipe } from "../engine/run-recipe";
import type { StepExecutors } from "../engine/step-executor";
import type { SourceFetch } from "../ports/source-fetch";
import { createFakeEndpointReader } from "../ports/testing/fake-endpoint-reader";
import { createFakeSourceFetch } from "../ports/testing/fake-source-fetch";
import { httpGet } from "./http-get";
import { transform } from "./transform";

const START = new Date("2026-11-22T10:00:00Z");
const FORECAST = "https://api.example.org/forecast";
const STATIONS = "https://api.example.org/stations.csv";

function unused(): never {
  throw new Error("This step kind is not part of the test.");
}

const EXECUTORS: StepExecutors = {
  "http.get": httpGet,
  transform,
  "html.select": unused,
  "text.match": unused,
  "endpoint.read": unused,
};

/** Sources that each take two seconds to answer, so the time of every fetch is distinct. */
function slowSources(clock: FakeClock): RunDeps {
  const answer = createFakeSourceFetch({
    [FORECAST]: {
      status: 200,
      contentType: "application/json",
      body: '{"current":{"temperature":21.5,"time":"2026-11-22T09:45:00Z"}}',
      bytes: 61,
    },
    [STATIONS]: {
      status: 200,
      contentType: "text/csv",
      body: "name;level_cm\nUpper;182\n",
      bytes: 24,
    },
  });
  const fetch: SourceFetch = async (request) => {
    clock.advance(2);
    return answer(request);
  };
  return { fetch, readEndpoint: createFakeEndpointReader({}), clock };
}

function recipe(asOf?: string): Recipe {
  return recipeSchema.parse({
    version: 1,
    steps: [
      { id: "forecast", use: "http.get", url: FORECAST, expect: "json" },
      { id: "stations", use: "http.get", url: STATIONS, expect: "csv" },
      {
        id: "out",
        use: "transform",
        expr: '{ "temperature_c": forecast.current.temperature, "level_m": $number(stations[0].level_cm) / 100 }',
      },
    ],
    output: "out",
    ...(asOf === undefined ? {} : { as_of: asOf }),
  });
}

describe("transform", () => {
  it("computes the value of a recipe from the results of its fetches", async () => {
    const run = await runRecipe(recipe(), slowSources(createFakeClock(START)), EXECUTORS);

    expect(run.result.ok && run.result.value.data).toEqual({ temperature_c: 21.5, level_m: 1.82 });
  });

  it("fails with the step's id when its expression fails", async () => {
    const failing = recipeSchema.parse({
      ...recipe(),
      steps: [...recipe().steps.slice(0, 2), { id: "out", use: "transform", expr: '"a" + 1' }],
    });

    const run = await runRecipe(failing, slowSources(createFakeClock(START)), EXECUTORS);

    expect(run.result).toEqual(err({ code: "expression_failed", step: "out" }));
  });
});

describe("as_of", () => {
  it("is the time the last fetch finished when the recipe does not say", async () => {
    const run = await runRecipe(recipe(), slowSources(createFakeClock(START)), EXECUTORS);

    expect(run.result.ok && run.result.value.asOf).toEqual(new Date("2026-11-22T10:00:04Z"));
  });

  it("is what the recipe's as_of expression says", async () => {
    const run = await runRecipe(
      recipe("forecast.current.time"),
      slowSources(createFakeClock(START)),
      EXECUTORS,
    );

    expect(run.result.ok && run.result.value.asOf).toEqual(new Date("2026-11-22T09:45:00Z"));
  });

  it("is the end of the run for a recipe that fetches nothing", async () => {
    const clock = createFakeClock(START);
    const constant = recipeSchema.parse({
      version: 1,
      steps: [{ id: "out", use: "transform", expr: '{ "answer": 42 }' }],
      output: "out",
    });

    const run = await runRecipe(constant, slowSources(clock), EXECUTORS);

    expect(run.result).toEqual(ok({ data: { answer: 42 }, asOf: START }));
  });

  it.each([
    ["a number", "forecast.current.temperature"],
    ["a local time", '"2026-11-22 09:45"'],
    ["an expression that fails", '"a" + 1'],
  ])("fails with expression_failed when it yields %s", async (_case, asOf) => {
    const run = await runRecipe(recipe(asOf), slowSources(createFakeClock(START)), EXECUTORS);

    expect(run.result).toEqual(err({ code: "expression_failed", step: "as_of" }));
  });
});
