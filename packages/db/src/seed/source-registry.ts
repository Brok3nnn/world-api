import type { SeedSource } from "./seed-source";
import { CISA_KEV_SOURCE } from "./sources/cisa-kev";
import { DWD_OPEN_DATA_SOURCE } from "./sources/dwd-open-data";
import { GEOPLATEFORME_GEOCODING_SOURCE } from "./sources/geoplateforme-geocoding";
import { NWS_SOURCE } from "./sources/nws";
import { UBA_AIR_DATA_SOURCE } from "./sources/uba-air-data";
import { US_TREASURY_FISCAL_DATA_SOURCE } from "./sources/us-treasury-fiscal-data";

/**
 * The approved sources recipes may read: only providers whose own terms clearly permit
 * commercial reuse and keyless automated access (tier green). Providers that allow it only
 * under conditions are left out until those conditions can be encoded and enforced.
 */
export const SOURCE_REGISTRY: readonly SeedSource[] = [
  NWS_SOURCE,
  DWD_OPEN_DATA_SOURCE,
  UBA_AIR_DATA_SOURCE,
  US_TREASURY_FISCAL_DATA_SOURCE,
  GEOPLATEFORME_GEOCODING_SOURCE,
  CISA_KEV_SOURCE,
];
