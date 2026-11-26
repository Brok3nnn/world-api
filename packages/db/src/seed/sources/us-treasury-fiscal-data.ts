import type { SeedSource } from "../seed-source";

/** U.S. Treasury Fiscal Data API. Terms checked on its own pages on 2026-11-22. */
export const US_TREASURY_FISCAL_DATA_SOURCE = {
  id: "src_us_treasury_fiscal_data",
  definition: {
    name: "U.S. Treasury Fiscal Data API",
    hosts: ["api.fiscaldata.treasury.gov"],
    docs_url: "https://fiscaldata.treasury.gov/api-documentation/",
    licence: "Unrestricted (U.S. Treasury open data)",
    attribution: null,
    terms:
      "U.S. Treasury open data offered free and without restriction; may be copied, adapted and redistributed for commercial or non-commercial purposes. No account or token required.",
    evidence_url: "https://fiscaldata.treasury.gov/api-documentation/",
    tier: "green",
    policy_checked_at: "2026-11-22T00:00:00Z",
    rate_limit_per_min: 30,
    capabilities: {
      offerings: [
        {
          name: "Treasury securities auction results",
          description:
            "Results of U.S. Treasury bill, note and bond auctions: auction date, security type and term, high yield and bid-to-cover ratio. Announced auctions not yet held show null results.",
          keywords: ["treasury", "auction", "bonds", "yield", "market data", "united states"],
          sample_url:
            "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/auctions_query?fields=auction_date,security_type,security_term,high_yield,bid_to_cover_ratio&sort=-auction_date&page%5Bsize%5D=10",
          format: "json",
        },
        {
          name: "Average interest rates on Treasury securities",
          description:
            "Monthly average interest rate by Treasury security type (for example bills, notes and bonds), marketable and non-marketable.",
          keywords: ["treasury", "interest rate", "bonds", "market data", "united states"],
          sample_url:
            "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/avg_interest_rates?sort=-record_date&page%5Bsize%5D=20",
          format: "json",
        },
        {
          name: "Treasury reporting rates of exchange",
          description:
            "Quarterly official U.S. Treasury exchange rates of foreign currencies per U.S. dollar, by country and currency.",
          keywords: ["exchange rate", "currency", "dollar", "treasury"],
          sample_url:
            "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/rates_of_exchange?fields=country_currency_desc,exchange_rate,record_date&filter=country_currency_desc:in:(Canada-Dollar,Mexico-Peso),record_date:gte:2024-01-01",
          format: "json",
        },
      ],
    },
  },
} satisfies SeedSource;
