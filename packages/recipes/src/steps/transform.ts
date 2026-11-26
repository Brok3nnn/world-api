import { ok } from "@repo/core/result";
import type { StepExecutor } from "../engine/step-executor";
import { evaluateExpression } from "../expression/evaluate-expression";

/** Computes a result from the results of earlier steps, each under its step id, with `expr`. */
export const transform: StepExecutor<"transform"> = async (step, { results, deps }) => {
  const value = await evaluateExpression(step.expr, Object.fromEntries(results), deps.clock);
  return value.ok ? ok({ value: value.value }) : value;
};
