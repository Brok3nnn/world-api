import type { SeedSource } from "../seed-source";

/** Deutscher Wetterdienst Open Data Server. Terms checked on its own pages on 2026-11-22. */
export const DWD_OPEN_DATA_SOURCE = {
  id: "src_dwd_open_data",
  definition: {
    name: "Deutscher Wetterdienst Open Data Server",
    hosts: ["opendata.dwd.de"],
    docs_url: "https://www.dwd.de/EN/ourservices/opendata/opendata.html",
    licence: "CC BY 4.0",
    // Every endpoint over this source selects and converts values, so the credit marks the data
    // as processed, in the wording the DWD legal notice gives for altered data.
    attribution: "Based on data from Deutscher Wetterdienst, values extracted and processed",
    terms:
      "CC BY 4.0 for DWD open spatial data; the server README points to the DWD legal notice, which grants it. Commercial use permitted under CC BY 4.0. Altered data must be marked as altered; altered official weather warnings must not carry DWD source details.",
    evidence_url: "https://www.dwd.de/EN/service/legal_notice/legal_notice.html",
    tier: "green",
    policy_checked_at: "2026-11-22T00:00:00Z",
    rate_limit_per_min: 30,
    capabilities: {
      offerings: [
        {
          name: "Station weather observations",
          description:
            "Hourly surface observations for a German or international station (WMO id in the file name): temperature, dew point, wind, gusts, pressure, cloud cover, precipitation, sunshine. Semicolon CSV with German labels; --- marks missing values.",
          keywords: ["weather", "observation", "temperature", "wind", "germany", "station"],
          sample_url: "https://opendata.dwd.de/weather/weather_reports/poi/10637-BEOB.csv",
          format: "csv",
        },
      ],
    },
  },
} satisfies SeedSource;
