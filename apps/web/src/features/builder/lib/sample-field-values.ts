import type { SchemaField, SchemaFieldType } from "../types";

const SAMPLE_VALUES: Record<SchemaFieldType, number | string | boolean> = {
  number: 42,
  string: "example",
  boolean: true,
};

/** Example payload for a list of output fields, e.g. `{ "birds_visible": 42 }`. */
export function sampleFromFields(fields: readonly SchemaField[]): Record<string, unknown> {
  return Object.fromEntries(fields.map((field) => [field.name, SAMPLE_VALUES[field.type]]));
}
