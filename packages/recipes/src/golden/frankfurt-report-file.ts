import { outputSpecSchema } from "@repo/contracts/endpoint/output-spec";
import { recipeSchema } from "@repo/contracts/recipe/recipe-schema";
import { type GoldenRecipe, RECORDED_AT } from "./golden-recipe";
import INDEX from "./recordings/dwd-station-report-index.json" with { type: "json" };

/** When the Frankfurt station report was last published, read from the open data server's index page. */
export const FRANKFURT_REPORT_FILE: GoldenRecipe = {
  ref: "@core/frankfurt-report-file",
  recipe: recipeSchema.parse({
    version: 1,
    steps: [
      { id: "index", use: "http.get", url: INDEX.url, expect: "html" },
      { id: "file", use: "html.select", from: "index", selector: 'a[href="10637-BEOB.csv"]' },
      {
        id: "listed",
        use: "text.match",
        from: "index",
        pattern:
          "10637-BEOB\\.csv</a>\\s+(?P<updated>\\d{2}-[A-Za-z]{3}-\\d{4} \\d{2}:\\d{2}:\\d{2})\\s+(?P<bytes>\\d+)",
      },
      {
        id: "out",
        use: "transform",
        expr: '{ "file": file, "updated": listed.updated, "size_bytes": $number(listed.bytes) }',
      },
    ],
    output: "out",
  }),
  outputSpec: outputSpecSchema.parse({
    schema: {
      type: "object",
      required: ["file", "updated", "size_bytes"],
      properties: {
        file: { type: "string", maxLength: 40 },
        updated: { type: "string", maxLength: 20 },
        size_bytes: { type: "number", minimum: 0 },
      },
      additionalProperties: false,
    },
    sentence: "The Frankfurt station report was last published {updated} UTC.",
  }),
  hosts: ["opendata.dwd.de"],
  recordings: [INDEX],
  endpoints: {},
  expected: {
    data: { file: "10637-BEOB.csv", updated: "22-Nov-2026 20:38:47", size_bytes: 7089 },
    asOf: RECORDED_AT,
  },
};
