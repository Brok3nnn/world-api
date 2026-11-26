import { outputSpecSchema } from "@repo/contracts/endpoint/output-spec";
import { recipeSchema } from "@repo/contracts/recipe/recipe-schema";
import type { GoldenRecipe } from "./golden-recipe";
import REPORT from "./recordings/frankfurt-station-report.json" with { type: "json" };

/** Decimal commas of the station report, read as numbers. */
const NUMBER = (column: string) => `$number($replace(report[2].${column}, ",", "."))`;

/**
 * The latest hourly observation at Frankfurt airport, from the Deutscher Wetterdienst station
 * report: a semicolon file whose first two rows are units and German labels, newest row next.
 */
export const FRANKFURT_WEATHER: GoldenRecipe = {
  ref: "@core/frankfurt-weather",
  recipe: recipeSchema.parse({
    version: 1,
    steps: [
      { id: "report", use: "http.get", url: REPORT.url, expect: "csv" },
      {
        id: "out",
        use: "transform",
        expr: `{
          "station": report[0].\`surface observations\`,
          "temperature_c": ${NUMBER("dry_bulb_temperature_at_2_meter_above_ground")},
          "humidity_percent": ${NUMBER("relative_humidity")},
          "pressure_hpa": ${NUMBER("pressure_reduced_to_mean_sea_level")}
        }`,
      },
    ],
    output: "out",
    as_of: `(
      $day := report[2].\`surface observations\`;
      "20" & $substring($day, 6, 2) & "-" & $substring($day, 3, 2) & "-" & $substring($day, 0, 2)
        & "T" & report[2].\`Parameter description\` & ":00Z"
    )`,
  }),
  outputSpec: outputSpecSchema.parse({
    schema: {
      type: "object",
      required: ["station", "temperature_c", "humidity_percent", "pressure_hpa"],
      properties: {
        station: { type: "string", maxLength: 8 },
        temperature_c: { type: "number", minimum: -90, maximum: 60 },
        humidity_percent: { type: "number", minimum: 0, maximum: 100 },
        pressure_hpa: { type: "number", minimum: 850, maximum: 1100 },
      },
      additionalProperties: false,
    },
    primary: "temperature_c",
    unit: "°C",
    sentence: "It is {temperature_c} °C at Frankfurt airport.",
  }),
  hosts: ["opendata.dwd.de"],
  recordings: [REPORT],
  endpoints: {},
  expected: {
    data: { station: "10637", temperature_c: 0.6, humidity_percent: 92, pressure_hpa: 1015.6 },
    asOf: "2026-11-22T20:00:00.000Z",
  },
};
