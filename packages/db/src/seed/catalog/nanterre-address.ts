import type { CatalogEndpointSeed } from "./catalog-endpoint";

/** Where 8 Rue du Port in Nanterre lies, from the French national geocoding service. */
export const NANTERRE_ADDRESS_ENDPOINT = {
  id: "ep_core_nanterre_address",
  definition: {
    owner: "core",
    slug: "nanterre-address",
    title: "8 Rue du Port, Nanterre",
    summary:
      "Coordinates and postal details of 8 Rue du Port in Nanterre, France, as the national address base gives them.",
    category: "places",
    visibility: "public",
    status: "live",
    method: "computed",
    freshness: "1d",
    price_credits: 1,
    output_spec: {
      schema: {
        type: "object",
        required: ["label", "latitude", "longitude", "postcode", "city"],
        properties: {
          label: { type: "string", maxLength: 120 },
          latitude: { type: "number", minimum: -90, maximum: 90 },
          longitude: { type: "number", minimum: -180, maximum: 180 },
          postcode: { type: "string", maxLength: 10 },
          city: { type: "string", maxLength: 80 },
        },
        additionalProperties: false,
      },
      sentence: "{label} lies at {latitude}, {longitude}.",
    },
  },
  recipe: {
    version: 1,
    steps: [
      {
        id: "found",
        use: "http.get",
        url: "https://data.geopf.fr/geocodage/search?q=8+bd+du+port+nanterre&limit=1",
        expect: "json",
      },
      {
        id: "out",
        use: "transform",
        expr: `(
          $place := found.features[0];
          {
            "label": $place.properties.label,
            "latitude": $place.geometry.coordinates[1],
            "longitude": $place.geometry.coordinates[0],
            "postcode": $place.properties.postcode,
            "city": $place.properties.city
          }
        )`,
      },
    ],
    output: "out",
  },
  sources: ["src_geoplateforme_geocoding"],
} satisfies CatalogEndpointSeed;
