import type { RecipeDocument } from "../recipe";

const FETCH = { use: "http.get", url: "https://data.example.org/v1", expect: "json" } as const;

/**
 * Documents with a valid shape that break exactly one rule spanning steps, named by the key.
 */
export const INVALID_RECIPE_EXAMPLES = {
  duplicate_id: {
    version: 1,
    steps: [
      { id: "out", ...FETCH },
      { id: "out", use: "transform", expr: "out.value" },
    ],
    output: "out",
  },
  forward_reference: {
    version: 1,
    steps: [
      { id: "cell", use: "html.select", from: "page", selector: "td" },
      { id: "page", ...FETCH, expect: "html" },
    ],
    output: "cell",
  },
  unknown_output: {
    version: 1,
    steps: [{ id: "page", ...FETCH }],
    output: "result",
  },
  too_many_fetches: {
    version: 1,
    steps: ["a", "b", "c", "d", "e"].map((id) => ({ id, ...FETCH })),
    output: "a",
  },
} satisfies Record<string, RecipeDocument>;
