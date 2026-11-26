import type { CatalogEndpointSeed } from "./catalog-endpoint";

/** A mix: how much warmer Topeka is than Frankfurt, from the two weather endpoints. */
export const WEATHER_DIFFERENCE_ENDPOINT = {
  id: "ep_core_weather_difference",
  definition: {
    owner: "core",
    slug: "weather-difference",
    title: "Topeka against Frankfurt",
    summary:
      "How much warmer it is at Topeka airport than at Frankfurt airport, from the two weather endpoints.",
    category: "weather",
    visibility: "public",
    status: "live",
    method: "computed",
    freshness: "1h",
    price_credits: 2,
    output_spec: {
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
    },
  },
  recipe: {
    version: 1,
    steps: [
      { id: "topeka", use: "endpoint.read", ref: "@core/topeka-weather" },
      { id: "frankfurt", use: "endpoint.read", ref: "@core/frankfurt-weather" },
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
  },
  // A mix credits the sources of the endpoints it reads.
  sources: ["src_nws", "src_dwd_open_data"],
} satisfies CatalogEndpointSeed;
