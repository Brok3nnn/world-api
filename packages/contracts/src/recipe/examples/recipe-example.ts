import type { RecipeDocument } from "../recipe";

/** A recipe that fetches a forecast, reads another endpoint and combines the two. */
export const RECIPE_EXAMPLE = {
  version: 1,
  steps: [
    {
      id: "forecast",
      use: "http.get",
      url: "https://api.example.org/v1/forecast?latitude=48.21&longitude=16.37",
      expect: "json",
    },
    { id: "rate", use: "endpoint.read", ref: "@core/eur-huf" },
    {
      id: "out",
      use: "transform",
      expr: '{ "temperature_c": forecast.current.temperature, "eur_huf": rate.rate }',
    },
  ],
  output: "out",
  as_of: "forecast.current.time",
} satisfies RecipeDocument;
