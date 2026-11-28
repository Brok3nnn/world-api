import { err, ok, type Result } from "@repo/core/result";
import type { Clock } from "@repo/core/time/clock";
import jsonata from "jsonata";
import type { JsonValue } from "../engine/json-value";
import type { StepFailure } from "../engine/run-failure";
import { RUN_LIMITS } from "../engine/run-limits";
import { toJsonValue } from "./to-json-value";

declare module "jsonata" {
  interface Expression {
    /** The evaluation hooks are keyed by symbols, which the published types do not list. */
    assign(name: symbol, value: () => void): void;
  }
}

/** Called by the library before it evaluates each node of the expression. */
const ENTRY_HOOK = Symbol.for("jsonata.__evaluate_entry");
/** The library's code for an evaluation that nested deeper than its `stack` option. */
const TOO_DEEP = "D1011";

/** Thrown from the entry hook when the expression has used up its time. */
class OutOfTime extends Error {}

/** Functions of the language that read the clock, randomness or run text as code. */
const DISABLED = ["now", "millis", "random", "shuffle", "eval"];

function disabled(): never {
  throw new Error("This function is not available in a recipe.");
}

/** Whether a parsed expression holds a regular expression literal anywhere. */
function hasRegex(node: unknown): boolean {
  if (typeof node !== "object" || node === null) {
    return false;
  }
  if ("type" in node && node.type === "regex") {
    return true;
  }
  return Object.values(node).some(hasRegex);
}

function failureOf(error: unknown): StepFailure {
  const tooDeep =
    typeof error === "object" && error !== null && "code" in error && error.code === TOO_DEEP;
  return { code: error instanceof OutOfTime || tooDeep ? "limit_exceeded" : "expression_failed" };
}

/**
 * Evaluates one JSONata expression against `input` with no way out: no clock, no randomness, no
 * text run as code, and no regular expression literal, which could backtrack without end.
 * Evaluation stops with `limit_exceeded` past the time or depth limit; any other error, or a
 * result that is not JSON, is `expression_failed`.
 */
export async function evaluateExpression(
  expr: string,
  input: JsonValue,
  clock: Clock,
): Promise<Result<JsonValue, StepFailure>> {
  try {
    const expression = jsonata(expr, { stack: RUN_LIMITS.expressionDepth });
    if (hasRegex(expression.ast())) {
      return err({ code: "expression_failed" });
    }
    const startedAt = clock.now().getTime();
    expression.assign(ENTRY_HOOK, () => {
      if (clock.now().getTime() - startedAt > RUN_LIMITS.expressionMs) {
        throw new OutOfTime();
      }
    });
    const bindings = Object.fromEntries(DISABLED.map((name) => [name, disabled]));
    const value = toJsonValue(await expression.evaluate(input, bindings));
    return value === undefined ? err({ code: "expression_failed" }) : ok(value);
  } catch (error) {
    // The library reports every failure, its limits included, only by throwing.
    return err(failureOf(error));
  }
}
