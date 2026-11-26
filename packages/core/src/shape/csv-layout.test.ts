import type { OutputSchemaNode } from "@repo/contracts/endpoint/output-schema";
import type { OutputSpec } from "@repo/contracts/endpoint/output-spec";
import { describe, expect, it } from "vitest";
import { csvLayout } from "./csv-layout";

function specOf(properties: Record<string, OutputSchemaNode>): OutputSpec {
  return { schema: { type: "object", properties, additionalProperties: false } };
}

const ROW = {
  type: "object",
  properties: { stop: { type: "string" }, minutes: { type: "number" } },
  additionalProperties: false,
} as const satisfies OutputSchemaNode;

describe("csvLayout", () => {
  it("makes the fields of a flat value the columns of one row, in order", () => {
    const spec = specOf({ temperature_c: { type: "number" }, raining: { type: "boolean" } });

    expect(csvLayout(spec)).toEqual({ kind: "row", columns: ["temperature_c", "raining"] });
  });

  it("makes each item of a single list of flat objects a row", () => {
    const spec = specOf({ departures: { type: "array", items: ROW } });

    expect(csvLayout(spec)).toEqual({
      kind: "rows",
      field: "departures",
      columns: ["stop", "minutes"],
    });
  });

  it.each([
    ["a value without fields", specOf({})],
    ["a nested object", specOf({ wind: ROW })],
    ["a list of plain values", specOf({ readings: { type: "array", items: { type: "number" } } })],
    [
      "a list beside another field",
      specOf({ rows: { type: "array", items: ROW }, total: { type: "number" } }),
    ],
    [
      "a list of objects that nest",
      specOf({ rows: { type: "array", items: specOf({ inner: ROW }).schema } }),
    ],
    ["a list of empty objects", specOf({ rows: { type: "array", items: specOf({}).schema } })],
  ])("has no table for %s", (_shape, spec) => {
    expect(csvLayout(spec)).toBeNull();
  });
});
