import type { OutputSpec } from "@repo/contracts/endpoint/output-spec";
import { err, ok, type Result } from "../result/result";
import type { ShapeFailure } from "./shape-failure";

type Value = Readonly<Record<string, unknown>>;

const SENTENCE_FIELD = /\{([^{}]*)\}/g;

function isPrintable(value: unknown): value is string | number | boolean {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

/**
 * The value as one sentence: the template of the output spec with every `{field}` replaced.
 * A field the value does not have is a failure, never the word "undefined" in the answer.
 */
export function renderText(value: Value, spec: OutputSpec): Result<string, ShapeFailure> {
  if (spec.sentence === undefined) {
    return err({ code: "shape_unsupported", shape: "text" });
  }
  const fields = Array.from(spec.sentence.matchAll(SENTENCE_FIELD), (match) =>
    match[0].slice(1, -1),
  );
  const missing = fields.find((field) => !isPrintable(value[field]));
  if (missing !== undefined) {
    return err({ code: "missing_field", shape: "text", field: missing });
  }
  return ok(
    spec.sentence.replaceAll(SENTENCE_FIELD, (_match, field: string) => String(value[field])),
  );
}
