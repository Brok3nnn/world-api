import { outputSpecSchema } from "@repo/contracts/endpoint/output-spec";
import { recipeSchema } from "@repo/contracts/recipe/recipe-schema";
import { FRANKFURT_WEATHER } from "./frankfurt-weather";
import { type GoldenRecipe, RECORDED_AT } from "./golden-recipe";
import { TOPEKA_WEATHER } from "./topeka-weather";

/** A mix: how much warmer Topeka is than Frankfurt, from the two weather endpoints. */
export const WEATHER_DIFFERENCE: GoldenRecipe = {
  ref: "@core/weather-difference",
  recipe: recipeSchema.parse({
    version: 1,
    steps: [
      { id: "topeka", use: "endpoint.read", ref: TOPEKA_WEATHER.ref },
      { id: "frankfurt", use: "endpoint.read", ref: FRANKFURT_WEATHER.ref },
      {
        id: "out",
        use: "transform",
        expr: `{
          "topeka_c": topeka.temperature_c,
          "frankfurt_c": frankfurt.temperature_c,
          "difference_c": $round(topeka.temperature_c - frankfurt.temperature_c, 1)
        }`,
      },
    ],
    output: "out",
  }),
  outputSpec: outputSpecSchema.parse({
    schema: {
      type: "object",
      required: ["topeka_c", "frankfurt_c", "difference_c"],
      properties: {
        topeka_c: { type: "number" },
        frankfurt_c: { type: "number" },
        difference_c: { type: "number" },
      },
      additionalProperties: false,
    },
    primary: "difference_c",
    unit: "°C",
    sentence: "Topeka is {difference_c} °C warmer than Frankfurt.",
  }),
  hosts: [],
  recordings: [],
  endpoints: {
    [TOPEKA_WEATHER.ref]: TOPEKA_WEATHER.expected.data,
    [FRANKFURT_WEATHER.ref]: FRANKFURT_WEATHER.expected.data,
  },
  expected: { data: { topeka_c: 9, frankfurt_c: 0.6, difference_c: 8.4 }, asOf: RECORDED_AT },
};
