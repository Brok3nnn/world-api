import type { RecipeStep } from "@repo/contracts/recipe/recipe-step";
import type { Result } from "@repo/core/result";
import type { JsonValue } from "./json-value";
import type { RunDeps } from "./run-deps";
import type { StepFailure } from "./run-failure";

/** The `use` of a step: which executor runs it. */
export type StepKind = RecipeStep["use"];

/** The step of one kind, with the fields that kind declares. */
export type StepOf<Kind extends StepKind> = Extract<RecipeStep, { use: Kind }>;

/** What an executor is given besides its step. */
export interface StepContext {
  /** The results of the steps that already ran, by step id. */
  readonly results: ReadonlyMap<string, JsonValue>;
  readonly deps: RunDeps;
}

/** What a step produced. */
export interface StepOutput {
  readonly value: JsonValue;
  /** Bytes fetched from a source, for a step that fetches. */
  readonly bytes?: number;
}

/** Runs every step of one kind. */
export type StepExecutor<Kind extends StepKind> = (
  step: StepOf<Kind>,
  context: StepContext,
) => Promise<Result<StepOutput, StepFailure>>;

/** One executor for every step kind of recipe version 1. */
export type StepExecutors = { readonly [Kind in StepKind]: StepExecutor<Kind> };
