import type { OutputSpec } from "@repo/contracts/endpoint/output-spec";
import { describe, expect, it } from "vitest";
import { renderText } from "./render-text";

const SPEC: OutputSpec = {
  schema: {
    type: "object",
    properties: {
      temperature_c: { type: "number" },
      place: { type: "string" },
      raining: { type: "boolean" },
    },
    additionalProperties: false,
  },
  sentence: "It is {temperature_c} °C in {place}.",
};

const VALUE = { temperature_c: 6.4, place: "Vienna", raining: false };

describe("renderText", () => {
  it("replaces every field of the sentence with its value", () => {
    expect(renderText(VALUE, SPEC)).toEqual({ ok: true, value: "It is 6.4 °C in Vienna." });
  });

  it("writes a boolean as true or false and repeats a field each time it appears", () => {
    const spec = { ...SPEC, sentence: "Raining: {raining}. Still {raining}." };

    expect(renderText(VALUE, spec)).toEqual({ ok: true, value: "Raining: false. Still false." });
  });

  it("returns a sentence without fields unchanged", () => {
    expect(renderText(VALUE, { ...SPEC, sentence: "Data is live." })).toEqual({
      ok: true,
      value: "Data is live.",
    });
  });

  it("is not offered without a sentence", () => {
    const { sentence: _removed, ...spec } = SPEC;

    expect(renderText(VALUE, spec)).toEqual({
      ok: false,
      error: { code: "shape_unsupported", shape: "text" },
    });
  });

  it.each([
    ["missing", { temperature_c: 6.4 }],
    ["null", { temperature_c: 6.4, place: null }],
    ["an object", { temperature_c: 6.4, place: { name: "Vienna" } }],
  ])("names a field that is %s instead of writing it", (_case, value) => {
    expect(renderText(value, SPEC)).toEqual({
      ok: false,
      error: { code: "missing_field", shape: "text", field: "place" },
    });
  });
});
