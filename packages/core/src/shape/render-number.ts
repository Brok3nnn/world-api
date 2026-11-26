import type { OutputSpec } from "@repo/contracts/endpoint/output-spec";
import { err, ok, type Result } from "../result/result";
import type { ShapeFailure } from "./shape-failure";

type Value = Readonly<Record<string, unknown>>;

/** The primary field of a value as a bare number, the whole body of the `number` shape. */
export function renderNumber(value: Value, spec: OutputSpec): Result<string, ShapeFailure> {
  const field = spec.primary;
  if (field === undefined || spec.schema.properties[field]?.type !== "number") {
    return err({ code: "shape_unsupported", shape: "number" });
  }
  const number = value[field];
  if (typeof number !== "number" || !Number.isFinite(number)) {
    return err({ code: "missing_field", shape: "number", field });
  }
  return ok(String(number));
}
