import type { CatalogEndpointSeed } from "./catalog-endpoint";

const RATE = (security: string) =>
  `$number(rates.data[record_date = $latest and security_desc = "${security}"].avg_interest_rate_amt)`;

/** Average interest rates on marketable US Treasury securities, from the Fiscal Data API. */
export const TREASURY_INTEREST_RATES_ENDPOINT = {
  id: "ep_core_treasury_interest_rates",
  definition: {
    owner: "core",
    slug: "treasury-interest-rates",
    title: "US Treasury interest rates",
    summary:
      "Average interest rates on marketable US Treasury bills and notes, and on all marketable debt, monthly.",
    category: "finance",
    visibility: "public",
    status: "live",
    method: "computed",
    freshness: "1d",
    price_credits: 1,
    output_spec: {
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
    },
  },
  recipe: {
    version: 1,
    steps: [
      {
        id: "rates",
        use: "http.get",
        url: "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/avg_interest_rates?sort=-record_date&page%5Bsize%5D=20",
        expect: "json",
      },
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
  },
  sources: ["src_us_treasury_fiscal_data"],
} satisfies CatalogEndpointSeed;
