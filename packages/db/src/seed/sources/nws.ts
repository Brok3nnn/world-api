import type { SeedSource } from "../seed-source";

/** National Weather Service API. Terms checked on its own pages on 2026-11-22. */
export const NWS_SOURCE = {
  id: "src_nws",
  definition: {
    name: "National Weather Service API",
    hosts: ["api.weather.gov"],
    docs_url: "https://www.weather.gov/documentation/services-web-api",
    licence: "Public domain (U.S. Government work)",
    attribution: null,
    terms:
      "US Government open data, free to use for any purpose; public domain unless noted. Requires a User-Agent identifying the app with contact details. Unpublished reasonable-use rate limits (retry after about 5 s). Do not imply NWS endorsement or present altered data as official.",
    evidence_url: "https://www.weather.gov/disclaimer",
    tier: "green",
    policy_checked_at: "2026-11-22T00:00:00Z",
    rate_limit_per_min: 30,
    capabilities: {
      offerings: [
        {
          name: "Gridpoint forecast",
          description:
            "Twelve-hour period forecast for a US forecast grid cell: temperature, wind speed and direction, precipitation probability and short forecast text. The grid cell for a coordinate comes from the points endpoint.",
          keywords: ["weather", "forecast", "temperature", "wind", "united states"],
          sample_url: "https://api.weather.gov/gridpoints/TOP/31,80/forecast",
          format: "json",
        },
        {
          name: "Latest station observation",
          description:
            "Most recent observation from a US weather station: temperature, dew point, wind, barometric pressure, visibility and relative humidity with units.",
          keywords: ["weather", "observation", "temperature", "station", "united states"],
          sample_url: "https://api.weather.gov/stations/KTOP/observations/latest",
          format: "json",
        },
        {
          name: "Active weather alerts",
          description:
            "Currently active watches, warnings and advisories for a US state or area, with event type, severity, urgency, onset and expiry times.",
          keywords: ["weather", "alerts", "warnings", "severe weather", "united states"],
          sample_url: "https://api.weather.gov/alerts/active?area=KS",
          format: "json",
        },
      ],
    },
  },
} satisfies SeedSource;
