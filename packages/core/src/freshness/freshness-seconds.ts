import type { Freshness } from "@repo/contracts/endpoint/freshness";

/** The interval of each freshness class, in seconds. */
export const FRESHNESS_SECONDS = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "1h": 3600,
  "1d": 86_400,
} as const satisfies Record<Freshness, number>;
