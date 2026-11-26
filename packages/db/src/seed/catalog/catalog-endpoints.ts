import type { CatalogEndpointSeed } from "./catalog-endpoint";
import { FRANKFURT_WEATHER_ENDPOINT } from "./frankfurt-weather";
import { LATEST_EXPLOITED_VULNERABILITY_ENDPOINT } from "./latest-exploited-vulnerability";
import { NANTERRE_ADDRESS_ENDPOINT } from "./nanterre-address";
import { TOPEKA_WEATHER_ENDPOINT } from "./topeka-weather";
import { TREASURY_INTEREST_RATES_ENDPOINT } from "./treasury-interest-rates";
import { WEATHER_DIFFERENCE_ENDPOINT } from "./weather-difference";

/** The catalog endpoints the seed writes under `@core`. */
export const CATALOG_ENDPOINTS: readonly CatalogEndpointSeed[] = [
  TOPEKA_WEATHER_ENDPOINT,
  TREASURY_INTEREST_RATES_ENDPOINT,
  NANTERRE_ADDRESS_ENDPOINT,
  FRANKFURT_WEATHER_ENDPOINT,
  LATEST_EXPLOITED_VULNERABILITY_ENDPOINT,
  WEATHER_DIFFERENCE_ENDPOINT,
];
