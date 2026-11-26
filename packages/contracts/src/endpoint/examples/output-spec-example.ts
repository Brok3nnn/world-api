import type { OutputSpec } from "../output-spec";

/** The output spec of a temperature endpoint, as shown in the recipe documentation. */
export const OUTPUT_SPEC_EXAMPLE = {
  schema: {
    type: "object",
    required: ["temperature_c"],
    properties: { temperature_c: { type: "number" } },
    additionalProperties: false,
  },
  primary: "temperature_c",
  unit: "°C",
  sentence: "It is {temperature_c} °C in Vienna.",
} satisfies OutputSpec;
