import type { OutputSchemaNode } from "@repo/contracts/endpoint/output-schema";
import type { OutputSpec } from "@repo/contracts/endpoint/output-spec";

/**
 * How an output spec maps to a table. `row`: its fields are the columns of a single row.
 * `rows`: one field is a list of flat objects, and each item is a row.
 */
export type CsvLayout =
  | { readonly kind: "row"; readonly columns: readonly string[] }
  | { readonly kind: "rows"; readonly field: string; readonly columns: readonly string[] };

function isScalar(node: OutputSchemaNode): boolean {
  return node.type === "string" || node.type === "number" || node.type === "boolean";
}

/**
 * The column names of an object whose fields are all scalars, or `null`. Required fields come
 * first, in the order the spec lists them: Postgres `jsonb` does not keep the order of keys.
 */
function flatColumns(node: OutputSchemaNode): string[] | null {
  if (node.type !== "object") {
    return null;
  }
  const required = node.required ?? [];
  const names = [
    ...required,
    ...Object.keys(node.properties).filter((name) => !required.includes(name)),
  ];
  const flat = names.length > 0 && Object.values(node.properties).every(isScalar);
  return flat ? names : null;
}

/** The table an output spec describes, or `null` when it is neither flat nor one flat list. */
export function csvLayout(spec: OutputSpec): CsvLayout | null {
  const columns = flatColumns(spec.schema);
  if (columns !== null) {
    return { kind: "row", columns };
  }
  const [entry, ...others] = Object.entries(spec.schema.properties);
  if (entry === undefined || others.length > 0) {
    return null;
  }
  const [field, node] = entry;
  const itemColumns = node.type === "array" ? flatColumns(node.items) : null;
  return itemColumns === null ? null : { kind: "rows", field, columns: itemColumns };
}
