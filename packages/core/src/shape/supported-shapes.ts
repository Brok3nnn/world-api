import type { Shape } from "@repo/contracts/api/shape";
import type { OutputSpec } from "@repo/contracts/endpoint/output-spec";
import { csvLayout } from "./csv-layout";

function hasNumericPrimary(spec: OutputSpec): boolean {
  return spec.primary !== undefined && spec.schema.properties[spec.primary]?.type === "number";
}

/**
 * The shapes an endpoint can answer in, from its output spec alone: `json` always, `number`
 * with a numeric primary field, `text` with a sentence, `csv` when the value is a flat row or
 * one list of flat rows.
 */
export function supportedShapes(spec: OutputSpec): Shape[] {
  const shapes: Shape[] = ["json"];
  if (hasNumericPrimary(spec)) {
    shapes.push("number");
  }
  if (spec.sentence !== undefined) {
    shapes.push("text");
  }
  if (csvLayout(spec) !== null) {
    shapes.push("csv");
  }
  return shapes;
}
