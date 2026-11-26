import type { Recipe } from "@repo/contracts/recipe/recipe-schema";
import type { RecipeStep } from "@repo/contracts/recipe/recipe-step";
import { err, ok, type Result } from "@repo/core/result";
import type { JsonValue } from "./json-value";
import { AS_OF, resolveAsOf } from "./resolve-as-of";
import type { RunDeps } from "./run-deps";
import type { RunFailure, StepFailure } from "./run-failure";
import { RUN_LIMITS } from "./run-limits";
import type { TraceEntry } from "./run-trace";
import type { StepContext, StepExecutors, StepOutput } from "./step-executor";

/** What a successful run produced: the result of the recipe's `output` step, and when it was observed. */
export interface RunValue {
  readonly data: JsonValue;
  readonly asOf: Date;
}

/** How a run ended, and what it did on the way, step by step. */
export interface RunOutcome {
  readonly result: Result<RunValue, RunFailure>;
  readonly trace: readonly TraceEntry[];
}

/** What every step of one run shares. */
interface RunState {
  readonly context: StepContext;
  readonly executors: StepExecutors;
  readonly startedAt: Date;
}

/** Hands a step to the executor of its kind; the switch keeps each pairing type-checked. */
function execute(
  step: RecipeStep,
  context: StepContext,
  executors: StepExecutors,
): Promise<Result<StepOutput, StepFailure>> {
  switch (step.use) {
    case "http.get":
      return executors["http.get"](step, context);
    case "transform":
      return executors.transform(step, context);
    case "html.select":
      return executors["html.select"](step, context);
    case "text.match":
      return executors["text.match"](step, context);
    case "endpoint.read":
      return executors["endpoint.read"](step, context);
  }
}

function millisecondsBetween(earlier: Date, later: Date): number {
  return later.getTime() - earlier.getTime();
}

/**
 * Runs one step and holds it to the time limits. A step that succeeded but took longer than a
 * step may, or ended after the run's budget, fails with `limit_exceeded`.
 */
async function runStep(
  step: RecipeStep,
  run: RunState,
): Promise<{ outcome: Result<StepOutput, StepFailure>; entry: TraceEntry; finishedAt: Date }> {
  const { clock } = run.context.deps;
  const startedAt = clock.now();
  const executed = await execute(step, run.context, run.executors);
  const finishedAt = clock.now();
  const durationMs = millisecondsBetween(startedAt, finishedAt);
  const overTime =
    durationMs > RUN_LIMITS.stepMs ||
    millisecondsBetween(run.startedAt, finishedAt) > RUN_LIMITS.runMs;
  const outcome: Result<StepOutput, StepFailure> =
    executed.ok && overTime ? err({ code: "limit_exceeded" }) : executed;
  const entry: TraceEntry = {
    step: step.id,
    kind: step.use,
    durationMs,
    bytes: executed.ok ? (executed.value.bytes ?? 0) : 0,
    outcome: outcome.ok ? "ok" : outcome.error.code,
  };
  return { outcome, entry, finishedAt };
}

/**
 * Runs a validated recipe: every step in order, each able to read the results of the steps
 * before it by id. The first failing step ends the run; later steps never run.
 */
export async function runRecipe(
  recipe: Recipe,
  deps: RunDeps,
  executors: StepExecutors,
): Promise<RunOutcome> {
  const results = new Map<string, JsonValue>();
  const run: RunState = { context: { results, deps }, executors, startedAt: deps.clock.now() };
  const trace: TraceEntry[] = [];
  let lastFetchAt: Date | undefined;
  for (const step of recipe.steps) {
    const { outcome, entry, finishedAt } = await runStep(step, run);
    trace.push(entry);
    if (!outcome.ok) {
      return { result: err({ code: outcome.error.code, step: step.id }), trace };
    }
    results.set(step.id, outcome.value.value);
    lastFetchAt = step.use === "http.get" ? finishedAt : lastFetchAt;
  }
  const data = results.get(recipe.output);
  if (data === undefined) {
    throw new Error(`The output step "${recipe.output}" is not a step of the recipe.`);
  }
  const asOf = await resolveAsOf(recipe, results, { clock: deps.clock, lastFetchAt });
  if (!asOf.ok) {
    return { result: err({ code: asOf.error.code, step: AS_OF }), trace };
  }
  return { result: ok({ data, asOf: asOf.value }), trace };
}
