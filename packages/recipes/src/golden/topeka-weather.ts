import { outputSpecSchema } from "@repo/contracts/endpoint/output-spec";
import { recipeSchema } from "@repo/contracts/recipe/recipe-schema";
import type { GoldenRecipe } from "./golden-recipe";
import OBSERVATION from "./recordings/topeka-latest-observation.json" with { type: "json" };

/** The latest observation at Topeka airport, from the National Weather Service. */
export const TOPEKA_WEATHER: GoldenRecipe = {
  ref: "@core/topeka-weather",
  recipe: recipeSchema.parse({
    version: 1,
    steps: [
      { id: "observation", use: "http.get", url: OBSERVATION.url, expect: "json" },
      {
        id: "out",
        use: "transform",
        expr: `{
          "station": observation.properties.stationName,
          "conditions": observation.properties.textDescription,
          "temperature_c": observation.properties.temperature.value,
          "wind_kmh": $round(observation.properties.windSpeed.value, 1),
          "humidity_percent": $round(observation.properties.relativeHumidity.value)
        }`,
      },
    ],
    output: "out",
    as_of: "$fromMillis($toMillis(observation.properties.timestamp))",
  }),
  outputSpec: outputSpecSchema.parse({
    schema: {
      type: "object",
      required: ["station", "conditions", "temperature_c", "wind_kmh", "humidity_percent"],
      properties: {
        station: { type: "string", maxLength: 80 },
        conditions: { type: "string", maxLength: 80 },
        temperature_c: { type: "number", minimum: -90, maximum: 60 },
        wind_kmh: { type: "number", minimum: 0, maximum: 500 },
        humidity_percent: { type: "number", minimum: 0, maximum: 100 },
      },
      additionalProperties: false,
    },
    primary: "temperature_c",
    unit: "°C",
    sentence: "It is {temperature_c} °C and {conditions} at {station}.",
  }),
  hosts: ["api.weather.gov"],
  recordings: [OBSERVATION],
  endpoints: {},
  expected: {
    data: {
      station: "Topeka, Philip Billard Municipal Airport",
      conditions: "Clear",
      temperature_c: 9,
      wind_kmh: 29.6,
      humidity_percent: 46,
    },
    asOf: "2026-11-22T20:20:00.000Z",
  },
};
