import type { OutputSpec } from "@repo/contracts/endpoint/output-spec";
import { describe, expect, it } from "vitest";
import { supportedShapes } from "./supported-shapes";

const SPEC: OutputSpec = {
  schema: {
    type: "object",
    properties: {
      temperature_c: { type: "number" },
      place: { type: "string" },
      wind: {
        type: "object",
        properties: { speed_ms: { type: "number" } },
        additionalProperties: false,
      },
    },
    additionalProperties: false,
  },
};

const FLAT: OutputSpec = {
  schema: {
    type: "object",
    properties: { temperature_c: { type: "number" }, place: { type: "string" } },
    additionalProperties: false,
  },
};

describe("supportedShapes", () => {
  it("offers only json without a primary field and without a sentence", () => {
    expect(supportedShapes(SPEC)).toEqual(["json"]);
  });

  it("offers number when the primary field is numeric", () => {
    expect(supportedShapes({ ...SPEC, primary: "temperature_c" })).toEqual(["json", "number"]);
  });

  it.each([
    "place",
    "wind",
  ])("does not offer number when the primary field %s is not a number", (primary) => {
    expect(supportedShapes({ ...SPEC, primary })).toEqual(["json"]);
  });

  it("offers text when there is a sentence", () => {
    expect(supportedShapes({ ...SPEC, sentence: "It is {temperature_c} °C." })).toEqual([
      "json",
      "text",
    ]);
  });

  it("does not offer csv for a value with a nested object", () => {
    expect(supportedShapes(SPEC)).not.toContain("csv");
  });

  it("offers csv for a flat value", () => {
    expect(supportedShapes(FLAT)).toEqual(["json", "csv"]);
  });

  it("offers every shape it can, in a fixed order", () => {
    const spec = { ...FLAT, primary: "temperature_c", sentence: "It is {temperature_c} °C." };

    expect(supportedShapes(spec)).toEqual(["json", "number", "text", "csv"]);
  });
});
