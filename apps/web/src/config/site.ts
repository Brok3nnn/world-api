/**
 * Product-wide constants. The product name and logo are intentionally not defined yet:
 * the UI must not hard-code a brand anywhere. When branding lands, add it here only.
 */
export const siteConfig = {
  title: "Real-world data API",
  description:
    "Design prototype of a real-world data API: one GET call answers in JSON, a number, a sentence or CSV.",
  /** Placeholder hosts. `example.com` is reserved for documentation (RFC 2606). */
  appBaseUrl: "https://app.example.com",
  apiBaseUrl: "https://api.example.com",
  mcpUrl: "https://api.example.com/mcp",
  llmsTxtUrl: "https://api.example.com/llms.txt",
  /** Browser UI color. Must equal the `cobalt-700` token in globals.css. */
  themeColor: "#174bc5",
} as const;

/**
 * The credit costs this prototype shows, as sample values. Credits are the planned unit of
 * price; nothing is charged, and no exchange rate, fee or payout is defined.
 */
export const sampleCreditCosts = {
  perSourceCall: 1,
  perModelAnswer: 10,
  newEndpoint: [1000, 2000],
} as const;
