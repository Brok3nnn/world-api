import { OUTPUT_SPEC_EXAMPLE } from "@repo/contracts/endpoint/examples/output-spec-example";
import { type OutputSpec, outputSpecSchema } from "@repo/contracts/endpoint/output-spec";
import { err } from "@repo/core/result";
import { describe, expect, it } from "vitest";
import type { JsonValue } from "../engine/json-value";
import { applyFirewall } from "./apply-firewall";

/** Water levels along a river: every node type and every rule of the dialect. */
const LEVELS: OutputSpec = outputSpecSchema.parse({
  schema: {
    type: "object",
    required: ["river", "stations"],
    properties: {
      river: { type: "string", maxLength: 8 },
      trend: { type: "string", enum: ["rising", "falling", "steady"] },
      flooding: { type: "boolean" },
      stations: {
        type: "array",
        maxItems: 3,
        items: {
          type: "object",
          required: ["name", "level_cm"],
          properties: {
            name: { type: "string" },
            level_cm: { type: "number", minimum: 0, maximum: 1500 },
          },
          additionalProperties: false,
        },
      },
    },
    additionalProperties: false,
  },
});

const UPPER = { name: "Upper", level_cm: 182 };

const VALID = {
  river: "Danube",
  trend: "rising",
  flooding: false,
  stations: [UPPER, { name: "Lower", level_cm: 0 }],
};

function violations(value: JsonValue, spec: OutputSpec = LEVELS) {
  const checked = applyFirewall(value, spec);
  return checked.ok ? [] : checked.error;
}

describe("applyFirewall", () => {
  it("returns a value that matches the spec unchanged", () => {
    const checked = applyFirewall(VALID, LEVELS);
    expect(checked.ok && checked.value).toBe(VALID);
    expect(violations({ temperature_c: -3.5 }, OUTPUT_SPEC_EXAMPLE)).toEqual([]);
  });

  it("accepts a value without its optional fields", () => {
    expect(violations({ river: "Danube", stations: [] })).toEqual([]);
  });

  it.each([
    ["an extra field", { ...VALID, secret: 1 }, { path: "/secret", rule: "additional_property" }],
    [
      "an extra nested field",
      { ...VALID, stations: [{ name: "A", level_cm: 1, raw: "x" }] },
      { path: "/stations/0/raw", rule: "additional_property" },
    ],
    ["a missing required field", { river: "Danube" }, { path: "/stations", rule: "required" }],
    [
      "a missing nested field",
      { ...VALID, stations: [{ name: "A" }] },
      { path: "/stations/0/level_cm", rule: "required" },
    ],
    [
      "a number given as text",
      { ...VALID, stations: [{ name: "A", level_cm: "182" }] },
      { path: "/stations/0/level_cm", rule: "type" },
    ],
    ["null for a field", { ...VALID, flooding: null }, { path: "/flooding", rule: "type" }],
    ["an object for an array", { ...VALID, stations: {} }, { path: "/stations", rule: "type" }],
    [
      "a number below the minimum",
      { ...VALID, stations: [{ name: "A", level_cm: -1 }] },
      { path: "/stations/0/level_cm", rule: "minimum" },
    ],
    [
      "a number above the maximum",
      { ...VALID, stations: [{ name: "A", level_cm: 1501 }] },
      { path: "/stations/0/level_cm", rule: "maximum" },
    ],
    ["a value outside enum", { ...VALID, trend: "sideways" }, { path: "/trend", rule: "enum" }],
    [
      "an over-long string",
      { ...VALID, river: "Mississippi" },
      { path: "/river", rule: "max_length" },
    ],
    [
      "an over-long array",
      { ...VALID, stations: [UPPER, UPPER, UPPER, UPPER] },
      { path: "/stations", rule: "max_items" },
    ],
    [
      "a number that is not finite",
      { ...VALID, stations: [{ name: "A", level_cm: Number.NaN }] },
      { path: "/stations/0/level_cm", rule: "type" },
    ],
    ["a value that is not an object", ["Danube"], { path: "", rule: "type" }],
  ] as const)("rejects %s at its path", (_case, value, violation) => {
    expect(violations(value)).toEqual([violation]);
  });

  it("counts characters, not code units, against maxLength", () => {
    expect(violations({ river: "🌊🌊🌊🌊🌊🌊🌊🌊", stations: [] })).toEqual([]);
  });

  it("escapes names in the path as JSON Pointer does", () => {
    expect(violations({ ...VALID, "a/b~c": 1 })).toEqual([
      { path: "/a~1b~0c", rule: "additional_property" },
    ]);
  });

  it("reports paths and rule names only, never the offending values", () => {
    const leaking = { ...VALID, river: "value-marker-0042", api_key: "value-marker-0043" };
    expect(JSON.stringify(violations(leaking))).not.toContain("value-marker");
  });

  it("reports at most twenty violations", () => {
    const stations = Array.from({ length: 30 }, () => ({ name: 1, level_cm: 1 }));
    expect(applyFirewall({ ...VALID, stations }, LEVELS)).toEqual(
      err(
        [{ path: "/stations", rule: "max_items" }].concat(
          Array.from({ length: 19 }, (_, index) => ({
            path: `/stations/${index}/name`,
            rule: "type",
          })),
        ),
      ),
    );
  });
});
