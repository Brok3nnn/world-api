import type { CatalogEndpointSeed } from "./catalog-endpoint";

const NUMBER = (column: string) => `$number($replace(report[2].${column}, ",", "."))`;

/** The latest hourly observation at Frankfurt airport, from the Deutscher Wetterdienst. */
export const FRANKFURT_WEATHER_ENDPOINT = {
  id: "ep_core_frankfurt_weather",
  definition: {
    owner: "core",
    slug: "frankfurt-weather",
    title: "Weather in Frankfurt",
    summary:
      "Latest hourly observation at Frankfurt airport, Germany: temperature, humidity and pressure.",
    category: "weather",
    visibility: "public",
    status: "live",
    method: "computed",
    freshness: "1h",
    price_credits: 1,
    output_spec: {
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
    },
  },
  recipe: {
    version: 1,
    steps: [
      {
        id: "report",
        use: "http.get",
        url: "https://opendata.dwd.de/weather/weather_reports/poi/10637-BEOB.csv",
        expect: "csv",
      },
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
  },
  sources: ["src_dwd_open_data"],
} satisfies CatalogEndpointSeed;
