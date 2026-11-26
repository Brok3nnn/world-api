import type { OutputSpec } from "@repo/contracts/endpoint/output-spec";
import { err, ok, type Result } from "../result/result";
import { csvLayout } from "./csv-layout";
import type { ShapeFailure } from "./shape-failure";

type Value = Readonly<Record<string, unknown>>;

const LINE_END = "\r\n";
const NEEDS_QUOTES = /[",\r\n]/;

/** One cell: empty for no value, quoted when it holds a comma, a quote or a line break. */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  const text = String(value);
  return NEEDS_QUOTES.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function csvLine(cells: readonly unknown[]): string {
  return cells.map(csvCell).join(",") + LINE_END;
}

function isRow(item: unknown): item is Value {
  return typeof item === "object" && item !== null;
}

/**
 * The value as a table: a header line, then one line for a flat value, or one line per item
 * for a value that is a list of flat objects. Lines end with a carriage return and line feed.
 */
export function renderCsv(value: Value, spec: OutputSpec): Result<string, ShapeFailure> {
  const layout = csvLayout(spec);
  if (layout === null) {
    return err({ code: "shape_unsupported", shape: "csv" });
  }
  const { columns } = layout;
  if (layout.kind === "row") {
    return ok(csvLine(columns) + csvLine(columns.map((column) => value[column])));
  }
  const items = value[layout.field];
  if (!Array.isArray(items) || !items.every(isRow)) {
    return err({ code: "missing_field", shape: "csv", field: layout.field });
  }
  const lines = items.map((item) => csvLine(columns.map((column) => item[column])));
  return ok(csvLine(columns) + lines.join(""));
}
