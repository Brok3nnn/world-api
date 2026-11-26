import type { OutputSpec } from "@repo/contracts/endpoint/output-spec";
import { describe, expect, it } from "vitest";
import { renderCsv } from "./render-csv";

const FLAT: OutputSpec = {
  schema: {
    type: "object",
    properties: {
      place: { type: "string" },
      temperature_c: { type: "number" },
      raining: { type: "boolean" },
    },
    additionalProperties: false,
  },
};

const LIST: OutputSpec = {
  schema: {
    type: "object",
    properties: {
      departures: {
        type: "array",
        items: {
          type: "object",
          properties: { line: { type: "string" }, minutes: { type: "number" } },
          additionalProperties: false,
        },
      },
    },
    additionalProperties: false,
  },
};

function body(lines: string[]): string {
  return lines.map((line) => `${line}\r\n`).join("");
}

describe("renderCsv", () => {
  it("writes a header and one row for a flat value", () => {
    const value = { place: "Vienna", temperature_c: 6.4, raining: false };

    expect(renderCsv(value, FLAT)).toEqual({
      ok: true,
      value: body(["place,temperature_c,raining", "Vienna,6.4,false"]),
    });
  });

  it("writes one row per item of a list", () => {
    const value = {
      departures: [
        { line: "U1", minutes: 2 },
        { line: "13A", minutes: 7 },
      ],
    };

    expect(renderCsv(value, LIST)).toEqual({
      ok: true,
      value: body(["line,minutes", "U1,2", "13A,7"]),
    });
  });

  it("writes only the header for an empty list", () => {
    expect(renderCsv({ departures: [] }, LIST)).toEqual({
      ok: true,
      value: body(["line,minutes"]),
    });
  });

  it.each([
    ["a comma", "Vienna, 1st district", '"Vienna, 1st district"'],
    ["a quote", 'The "Ring"', '"The ""Ring"""'],
    ["a line break", "Line 1\nLine 2", '"Line 1\nLine 2"'],
    ["a carriage return", "a\rb", '"a\rb"'],
  ])("quotes a cell that contains %s", (_case, place, cell) => {
    const value = { place, temperature_c: 1, raining: true };

    expect(renderCsv(value, FLAT)).toEqual({
      ok: true,
      value: body(["place,temperature_c,raining", `${cell},1,true`]),
    });
  });

  it("leaves a cell empty for a field without a value", () => {
    expect(renderCsv({ place: "Vienna", raining: null }, FLAT)).toEqual({
      ok: true,
      value: body(["place,temperature_c,raining", "Vienna,,"]),
    });
  });

  it("is not offered for a value that is not a table", () => {
    const nested: OutputSpec = { schema: { ...FLAT.schema, properties: { wind: FLAT.schema } } };

    expect(renderCsv({}, nested)).toEqual({
      ok: false,
      error: { code: "shape_unsupported", shape: "csv" },
    });
  });

  it.each([
    ["missing", {}],
    ["not a list", { departures: "U1" }],
    [
      "a list with an item that is not an object",
      { departures: [{ line: "U1", minutes: 2 }, null] },
    ],
  ])("names the list field when it is %s", (_case, value) => {
    expect(renderCsv(value, LIST)).toEqual({
      ok: false,
      error: { code: "missing_field", shape: "csv", field: "departures" },
    });
  });
});
