import type { Freshness } from "@repo/contracts/endpoint/freshness";
import { addSeconds } from "../time/duration";
import { FRESHNESS_SECONDS } from "./freshness-seconds";

/** The earliest instant a newer value can exist: one freshness interval after the fetch. */
export function nextRefresh(fetchedAt: Date, freshness: Freshness): Date {
  return addSeconds(fetchedAt, FRESHNESS_SECONDS[freshness]);
}
