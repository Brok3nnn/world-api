import { outputSpecSchema } from "@repo/contracts/endpoint/output-spec";
import { recipeSchema } from "@repo/contracts/recipe/recipe-schema";
import type { GoldenRecipe } from "./golden-recipe";
import RATES from "./recordings/treasury-average-interest-rates.json" with { type: "json" };

/** The rate of one kind of security on the latest record date, as a number. */
const RATE = (security: string) =>
  `$number(rates.data[record_date = $latest and security_desc = "${security}"].avg_interest_rate_amt)`;

/** Average interest rates on marketable US Treasury securities, from the Fiscal Data API. */
export const TREASURY_INTEREST_RATES: GoldenRecipe = {
  ref: "@core/treasury-interest-rates",
  recipe: recipeSchema.parse({
    version: 1,
    steps: [
      { id: "rates", use: "http.get", url: RATES.url, expect: "json" },
      {
        id: "out",
        use: "transform",
        expr: `(
          $latest := rates.data[0].record_date;
          {
            "record_date": $latest,
            "bills_percent": ${RATE("Treasury Bills")},
            "notes_percent": ${RATE("Treasury Notes")},
            "marketable_percent": ${RATE("Total Marketable")}
          }
        )`,
      },
    ],
    output: "out",
    as_of: 'rates.data[0].record_date & "T00:00:00Z"',
  }),
  outputSpec: outputSpecSchema.parse({
    schema: {
      type: "object",
      required: ["record_date", "bills_percent", "notes_percent", "marketable_percent"],
      properties: {
        record_date: { type: "string", maxLength: 10 },
        bills_percent: { type: "number", minimum: 0, maximum: 25 },
        notes_percent: { type: "number", minimum: 0, maximum: 25 },
        marketable_percent: { type: "number", minimum: 0, maximum: 25 },
      },
      additionalProperties: false,
    },
    primary: "marketable_percent",
    unit: "%",
    sentence: "Marketable Treasury debt paid {marketable_percent} % on average on {record_date}.",
  }),
  hosts: ["api.fiscaldata.treasury.gov"],
  recordings: [RATES],
  endpoints: {},
  expected: {
    data: {
      record_date: "2026-10-31",
      bills_percent: 4.014,
      notes_percent: 3.399,
      marketable_percent: 3.57,
    },
    asOf: "2026-10-31T00:00:00.000Z",
  },
};
