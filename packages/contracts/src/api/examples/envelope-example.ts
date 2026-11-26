import type { Envelope } from "../envelope";

/** The response of an endpoint call in the default shape, as shown in the API reference. */
export const ENVELOPE_EXAMPLE = {
  data: { temperature_c: 4.2 },
  as_of: "2026-11-21T11:45:00Z",
  sources: [
    {
      name: "Example open weather service",
      url: "https://example.org/docs/weather",
      licence: "CC BY 4.0",
      attribution: "Weather data: Example open weather service, CC BY 4.0",
    },
  ],
  next_refresh: "2026-11-21T12:00:00Z",
  method: "computed",
  price_credits: 1,
} as const satisfies Envelope;
