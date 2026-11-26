import type { OutputSpec } from "@repo/contracts/endpoint/output-spec";
import { describe, expect, it } from "vitest";
import { renderNumber } from "./render-number";

const SPEC: OutputSpec = {
  schema: {
    type: "object",
    properties: { temperature_c: { type: "number" }, place: { type: "string" } },
    additionalProperties: false,
  },
  primary: "temperature_c",
};

describe("renderNumber", () => {
  it.each([
    [6.4, "6.4"],
    [-3, "-3"],
    [0, "0"],
    [84215, "84215"],
  ])("renders %d as %s", (temperature_c, body) => {
    expect(renderNumber({ temperature_c, place: "Vienna" }, SPEC)).toEqual({
      ok: true,
      value: body,
    });
  });

  it("is not offered without a primary field", () => {
    const { primary: _removed, ...spec } = SPEC;

    expect(renderNumber({ temperature_c: 6.4 }, spec)).toEqual({
      ok: false,
      error: { code: "shape_unsupported", shape: "number" },
    });
  });

  it("is not offered when the primary field is text", () => {
    expect(renderNumber({ place: "Vienna" }, { ...SPEC, primary: "place" }).ok).toBe(false);
  });

  it.each([
    ["missing", {}],
    ["text", { temperature_c: "6.4" }],
    ["not finite", { temperature_c: Number.NaN }],
  ])("fails with the field when it is %s", (_case, value) => {
    expect(renderNumber(value, SPEC)).toEqual({
      ok: false,
      error: { code: "missing_field", shape: "number", field: "temperature_c" },
    });
  });
});
