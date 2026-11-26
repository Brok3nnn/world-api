import type { SourceDefinition } from "../source-definition";

/** An approved weather source as the registry records it. */
export const SOURCE_EXAMPLE = {
  name: "Example open weather service",
  hosts: ["api.example.org"],
  docs_url: "https://example.org/docs/weather",
  licence: "CC BY 4.0",
  attribution: "Weather data: Example open weather service, CC BY 4.0",
  terms: "Open data under CC BY 4.0: commercial use and automated access permitted with credit.",
  evidence_url: "https://example.org/terms",
  tier: "green",
  policy_checked_at: "2026-11-21T10:00:00Z",
  rate_limit_per_min: 60,
  capabilities: {
    offerings: [
      {
        name: "Current weather for a coordinate",
        description: "Air temperature, wind and precipitation now, for any latitude and longitude.",
        keywords: ["weather", "temperature", "wind", "rain"],
        sample_url: "https://api.example.org/v1/forecast?latitude=48.21&longitude=16.37",
        format: "json",
      },
    ],
  },
} satisfies SourceDefinition;
