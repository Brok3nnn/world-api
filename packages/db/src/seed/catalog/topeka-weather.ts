import type { CatalogEndpointSeed } from "./catalog-endpoint";

/** The latest observation at Topeka airport, from the National Weather Service. */
export const TOPEKA_WEATHER_ENDPOINT = {
  id: "ep_core_topeka_weather",
  definition: {
    owner: "core",
    slug: "topeka-weather",
    title: "Weather in Topeka",
    summary:
      "Latest observation at Topeka airport, Kansas: temperature, conditions, wind and humidity.",
    category: "weather",
    visibility: "public",
    status: "live",
    method: "computed",
    freshness: "15m",
    price_credits: 1,
    output_spec: {
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
    },
  },
  recipe: {
    version: 1,
    steps: [
      {
        id: "observation",
        use: "http.get",
        url: "https://api.weather.gov/stations/KTOP/observations/latest",
        expect: "json",
      },
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
  },
  sources: ["src_nws"],
} satisfies CatalogEndpointSeed;
