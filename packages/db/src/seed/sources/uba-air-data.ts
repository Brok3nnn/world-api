import type { SeedSource } from "../seed-source";

/** Umweltbundesamt Air Data API v4. Terms checked on its own pages on 2026-11-22. */
export const UBA_AIR_DATA_SOURCE = {
  id: "src_uba_air_data",
  definition: {
    name: "Umweltbundesamt Air Data API v4",
    hosts: ["luftdaten.umweltbundesamt.de"],
    docs_url: "https://luftdaten.umweltbundesamt.de/api/air-data/v4/doc",
    licence: "dl-de/by-2-0",
    attribution:
      "Source: German Environment Agency (Umweltbundesamt) with data from the federal and state monitoring networks; dl-de/by-2-0 (https://www.govdata.de/dl-de/by-2-0)",
    terms:
      "Data licence Germany - attribution - 2.0 (dl-de/by-2-0); UBA terms explicitly allow commercial use, passing data to third parties and use in products. Changes must be marked in the credit. Current-year values are unaudited. Use v4; v3 is deprecated and sunsets 2027-02-01.",
    evidence_url: "https://luftdaten.umweltbundesamt.de/en/disclaimer-privacy-policy-and-copyright",
    tier: "green",
    policy_checked_at: "2026-11-22T00:00:00Z",
    rate_limit_per_min: 30,
    capabilities: {
      offerings: [
        {
          name: "Hourly air quality index",
          description:
            "Hourly air quality index for a German monitoring station with per-pollutant concentrations (PM10, PM2.5, NO2, O3) for a date and hour range.",
          keywords: ["air quality", "aqi", "pollution", "pm10", "no2", "ozone", "germany"],
          sample_url:
            "https://luftdaten.umweltbundesamt.de/api/air-data/v4/airquality/json?date_from=2026-11-21&time_from=1&date_to=2026-11-21&time_to=24&station=DEBE010",
          format: "json",
        },
        {
          name: "Pollutant measurements",
          description:
            "Measured concentrations of one pollutant at one station for a period and averaging scope (for example hourly NO2 in micrograms per cubic metre).",
          keywords: ["air quality", "measurement", "no2", "particulate matter", "germany"],
          sample_url:
            "https://luftdaten.umweltbundesamt.de/api/air-data/v4/measures/json?date_from=2026-11-21&time_from=1&date_to=2026-11-21&time_to=24&station=DEBE010&component=5&scope=2",
          format: "json",
        },
        {
          name: "Monitoring stations",
          description:
            "List of German air monitoring stations with id, code, name, city, coordinates, network, setting and station type, used to resolve station parameters.",
          keywords: ["air quality", "stations", "monitoring", "germany"],
          sample_url: "https://luftdaten.umweltbundesamt.de/api/air-data/v4/stations/json?lang=en",
          format: "json",
        },
      ],
    },
  },
} satisfies SeedSource;
