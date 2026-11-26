import type { SeedSource } from "../seed-source";

/** Géoplateforme geocoding service (IGN, France). Terms checked on its own pages on 2026-11-22. */
export const GEOPLATEFORME_GEOCODING_SOURCE = {
  id: "src_geoplateforme_geocoding",
  definition: {
    name: "Géoplateforme geocoding service (IGN, France)",
    hosts: ["data.geopf.fr"],
    docs_url:
      "https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/geocodage/",
    licence: "Licence Ouverte 2.0",
    // The licence also asks for the date of the data. The geocoding answer carries none, so the
    // date to show with this credit is the envelope's `as_of`, the time it was retrieved.
    attribution: "Source: Base Adresse Nationale (BAN) via IGN Géoplateforme",
    terms:
      "Address data (Base Adresse Nationale) under Licence Ouverte / Open Licence 2.0: commercial reuse allowed. Géoplateforme terms cover commercial developers, free of charge, limit 50 req/s per IP (HTTP 429 beyond). Credit must name the source and the last update date.",
    evidence_url: "https://cartes.gouv.fr/cgu",
    tier: "green",
    policy_checked_at: "2026-11-22T00:00:00Z",
    rate_limit_per_min: 600,
    capabilities: {
      offerings: [
        {
          name: "Address geocoding (France)",
          description:
            "Turn a French address into coordinates with a normalised label, house number, street, postcode, municipality code and match score, as GeoJSON.",
          keywords: ["geocoding", "address", "map", "coordinates", "france"],
          sample_url: "https://data.geopf.fr/geocodage/search?q=8+bd+du+port+nanterre&limit=1",
          format: "json",
        },
        {
          name: "Reverse geocoding (France)",
          description:
            "Return the nearest French address for a longitude and latitude, with label, postcode, municipality and distance.",
          keywords: ["reverse geocoding", "address", "map", "coordinates", "france"],
          sample_url: "https://data.geopf.fr/geocodage/reverse?lon=2.3488&lat=48.8534&limit=1",
          format: "json",
        },
      ],
    },
  },
} satisfies SeedSource;
