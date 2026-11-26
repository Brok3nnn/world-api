import type { Recipe } from "../recipe-schema";
import { RECIPE_EXAMPLE } from "./recipe-example";

/** Recipes that pass every rule, one per way of producing a value. */
export const VALID_RECIPE_EXAMPLES = {
  /** One fetch, one read of another endpoint, one transform. */
  combined: RECIPE_EXAMPLE,
  /** A mix: only reads of other endpoints. */
  mix: {
    version: 1,
    steps: [
      { id: "weather", use: "endpoint.read", ref: "@core/weather-now-vienna" },
      { id: "rate", use: "endpoint.read", ref: "@core/eur-huf" },
      {
        id: "out",
        use: "transform",
        expr: '{ "temperature_c": weather.temperature_c, "eur_huf": rate.rate }',
      },
    ],
    output: "out",
  },
  /** A value read from a page: select a cell, capture the number, shape the result. */
  page: {
    version: 1,
    steps: [
      {
        id: "page",
        use: "http.get",
        url: "https://water.example.org/levels/danube",
        expect: "html",
      },
      { id: "cell", use: "html.select", from: "page", selector: "table.levels td.current" },
      { id: "level", use: "text.match", from: "cell", pattern: "(\\d+) cm" },
      { id: "out", use: "transform", expr: '{ "level_cm": $number(level[0]) }' },
    ],
    output: "out",
  },
} satisfies Record<string, Recipe>;
