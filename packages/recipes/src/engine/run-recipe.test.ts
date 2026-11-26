import { type Recipe, recipeSchema } from "@repo/contracts/recipe/recipe-schema";
import { err, ok } from "@repo/core/result";
import { createFakeClock, type FakeClock } from "@repo/core/time/testing/fake-clock";
import { describe, expect, it } from "vitest";
import type { EndpointData } from "../ports/endpoint-reader";
import { createFakeEndpointReader } from "../ports/testing/fake-endpoint-reader";
import { createFakeSourceFetch } from "../ports/testing/fake-source-fetch";
import type { RunDeps } from "./run-deps";
import { runRecipe } from "./run-recipe";
import type { StepExecutors } from "./step-executor";

const FORECAST_URL = "https://api.example.org/forecast";
const START = new Date("2026-11-22T10:00:00Z");

function testDeps(
  clock: FakeClock = createFakeClock(START),
  answers: { body: string; rate: EndpointData } = { body: "21.5", rate: { rate: 401.2 } },
): RunDeps {
  return {
    fetch: createFakeSourceFetch({
      [FORECAST_URL]: { status: 200, contentType: "text/plain", body: answers.body, bytes: 4 },
    }),
    readEndpoint: createFakeEndpointReader({ "@core/eur-huf": answers.rate }),
    clock,
  };
}

/** Stub executors: each tells `onStep` that it ran and produces a small, recognisable result. */
function stubExecutors(
  onStep: (id: string) => void = () => undefined,
  overrides: Partial<StepExecutors> = {},
): StepExecutors {
  return {
    "http.get": async (step, { deps }) => {
      onStep(step.id);
      const response = await deps.fetch({ url: step.url, headers: {} });
      return response.ok
        ? ok({ value: response.value.body, bytes: response.value.bytes })
        : err({ code: response.error.code });
    },
    transform: async (step, { results }) => {
      onStep(step.id);
      return ok({ value: { inputs: [...results.keys()] } });
    },
    "html.select": async (step) => {
      onStep(step.id);
      return ok({ value: "selected" });
    },
    "text.match": async (step) => {
      onStep(step.id);
      return ok({ value: { group: "matched" } });
    },
    "endpoint.read": async (step, { deps }) => {
      onStep(step.id);
      const read = await deps.readEndpoint(step.ref);
      return read.ok ? ok({ value: read.value }) : err({ code: read.error.code });
    },
    ...overrides,
  };
}

/** Executors whose steps take the given number of seconds on the fake clock. */
function timedExecutors(clock: FakeClock, seconds: Readonly<Record<string, number>>) {
  return stubExecutors((id) => clock.advance(seconds[id] ?? 0));
}

function recipe(document: unknown): Recipe {
  return recipeSchema.parse(document);
}

const EVERY_KIND = recipe({
  version: 1,
  steps: [
    { id: "page", use: "http.get", url: FORECAST_URL, expect: "html" },
    { id: "cell", use: "html.select", from: "page", selector: "td" },
    { id: "digits", use: "text.match", from: "cell", pattern: "([0-9]+)" },
    { id: "rate", use: "endpoint.read", ref: "@core/eur-huf" },
    { id: "out", use: "transform", expr: "rate.rate" },
  ],
  output: "out",
});

describe("runRecipe", () => {
  it("runs every step in order with its own executor and returns the output step's result", async () => {
    const calls: string[] = [];
    const run = await runRecipe(
      EVERY_KIND,
      testDeps(),
      stubExecutors((id) => calls.push(id)),
    );
    expect(calls).toEqual(["page", "cell", "digits", "rate", "out"]);
    expect(run.result).toEqual(
      ok({ data: { inputs: ["page", "cell", "digits", "rate"] }, asOf: START }),
    );
  });

  it("gives each executor the results of earlier steps and the ports of the run", async () => {
    const seen: unknown[] = [];
    const executors = stubExecutors(undefined, {
      transform: async (_step, { results }) => {
        seen.push(results.get("forecast"), results.get("rate"));
        return ok({ value: null });
      },
    });
    const twoSources = recipe({
      version: 1,
      steps: [
        { id: "forecast", use: "http.get", url: FORECAST_URL, expect: "text" },
        { id: "rate", use: "endpoint.read", ref: "@core/eur-huf" },
        { id: "out", use: "transform", expr: "forecast" },
      ],
      output: "out",
    });
    const run = await runRecipe(twoSources, testDeps(), executors);
    expect(seen).toEqual(["21.5", { rate: 401.2 }]);
    expect(run.result).toEqual(ok({ data: null, asOf: START }));
  });

  it("returns the result of an earlier step when the recipe names it as the output", async () => {
    const earlyOutput = recipe({ ...EVERY_KIND, output: "rate" });
    const run = await runRecipe(earlyOutput, testDeps(), stubExecutors());
    expect(run.result).toEqual(ok({ data: { rate: 401.2 }, asOf: START }));
  });

  it("ends the run at the first failing step, with its code and id", async () => {
    const calls: string[] = [];
    const executors = stubExecutors((id) => calls.push(id), {
      "text.match": async (step) => {
        calls.push(step.id);
        return err({ code: "pattern_no_match" });
      },
    });
    const run = await runRecipe(EVERY_KIND, testDeps(), executors);
    expect(run.result).toEqual(err({ code: "pattern_no_match", step: "digits" }));
    expect(calls).toEqual(["page", "cell", "digits"]);
  });

  it("treats an output that names no step as a defect", async () => {
    // Built without the schema on purpose: a parsed recipe can never name a missing step.
    const broken: Recipe = { ...EVERY_KIND, output: "missing" };
    await expect(runRecipe(broken, testDeps(), stubExecutors())).rejects.toThrow(
      'The output step "missing" is not a step of the recipe.',
    );
  });
});

describe("runRecipe trace and time limits", () => {
  it("records each step's kind, duration, fetched bytes and outcome", async () => {
    const clock = createFakeClock(START);
    const run = await runRecipe(EVERY_KIND, testDeps(clock), timedExecutors(clock, { page: 0.25 }));
    expect(run.trace).toEqual([
      { step: "page", kind: "http.get", durationMs: 250, bytes: 4, outcome: "ok" },
      { step: "cell", kind: "html.select", durationMs: 0, bytes: 0, outcome: "ok" },
      { step: "digits", kind: "text.match", durationMs: 0, bytes: 0, outcome: "ok" },
      { step: "rate", kind: "endpoint.read", durationMs: 0, bytes: 0, outcome: "ok" },
      { step: "out", kind: "transform", durationMs: 0, bytes: 0, outcome: "ok" },
    ]);
  });

  it("lets a step take exactly the time a step may take", async () => {
    const clock = createFakeClock(START);
    const run = await runRecipe(EVERY_KIND, testDeps(clock), timedExecutors(clock, { cell: 10 }));
    expect(run.result.ok).toBe(true);
  });

  it("fails a step that takes longer than a step may, and runs nothing after it", async () => {
    const clock = createFakeClock(START);
    const executors = timedExecutors(clock, { cell: 10.001 });
    const run = await runRecipe(EVERY_KIND, testDeps(clock), executors);
    expect(run.result).toEqual(err({ code: "limit_exceeded", step: "cell" }));
    expect(run.trace.map((entry) => [entry.step, entry.durationMs, entry.outcome])).toEqual([
      ["page", 0, "ok"],
      ["cell", 10_001, "limit_exceeded"],
    ]);
  });

  it("fails the step that ends after the run's budget, though each step was quick enough", async () => {
    const clock = createFakeClock(START);
    const executors = timedExecutors(clock, { page: 9, cell: 9, digits: 2.5 });
    const run = await runRecipe(EVERY_KIND, testDeps(clock), executors);
    expect(run.result).toEqual(err({ code: "limit_exceeded", step: "digits" }));
  });

  it("keeps a step's own failure when it also ran over time", async () => {
    const clock = createFakeClock(START);
    const executors = stubExecutors(undefined, {
      "html.select": async () => {
        clock.advance(11);
        return err({ code: "selector_empty" });
      },
    });
    const run = await runRecipe(EVERY_KIND, testDeps(clock), executors);
    expect(run.result).toEqual(err({ code: "selector_empty", step: "cell" }));
  });

  it("gives the same outcome and trace for the same recipe and answers", async () => {
    const outcomes = await Promise.all(
      [1, 2].map(() => {
        const clock = createFakeClock(START);
        return runRecipe(EVERY_KIND, testDeps(clock), timedExecutors(clock, { rate: 1.5 }));
      }),
    );
    expect(outcomes[0]).toEqual(outcomes[1]);
  });

  it("never records a response body or a value in the trace", async () => {
    const answers = { body: "body-marker-4711", rate: { rate: "value-marker-4712" } };
    const earlyOutput = recipe({ ...EVERY_KIND, output: "rate" });
    const run = await runRecipe(earlyOutput, testDeps(undefined, answers), stubExecutors());
    expect(run.result).toEqual(ok({ data: { rate: "value-marker-4712" }, asOf: START }));
    const trace = JSON.stringify(run.trace);
    expect(trace).not.toContain("body-marker-4711");
    expect(trace).not.toContain("value-marker-4712");
  });
});
