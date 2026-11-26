import { formatIsoSeconds } from "@/lib/format";
import { REFRESH_INTERVALS } from "../constants";
import type { Endpoint, Shape } from "../types";

/**
 * Renders the body an endpoint returns for a given shape. Every JSON response uses the same
 * envelope (`data`, `as_of`, `sources`, `next_refresh`, `method`, `price_credits`) so tools
 * only have to learn it once.
 */
export function renderResponsePreview(endpoint: Endpoint, shape: Shape): string {
  switch (shape) {
    case "number":
      return String(endpoint.sample.number ?? "null");
    case "text":
      return endpoint.sample.text;
    case "csv":
      return endpoint.sample.csv;
    case "probability":
      return toJson({
        question: endpoint.sample.probability?.question ?? null,
        probability: endpoint.sample.probability?.value ?? null,
        basis: endpoint.sample.data,
        calibration: endpoint.stats.calibration ?? null,
        as_of: endpoint.asOf,
        method: "model-estimate",
      });
    case "json":
      return toJson({
        data: endpoint.sample.data,
        as_of: endpoint.asOf,
        sources: endpoint.sources.map((source) => source.name),
        next_refresh: nextRefresh(endpoint),
        method: endpoint.method,
        price_credits: endpoint.priceCredits,
      });
  }
}

function nextRefresh(endpoint: Endpoint): string {
  const seconds = REFRESH_INTERVALS[endpoint.refresh].seconds;
  return formatIsoSeconds(new Date(new Date(endpoint.asOf).getTime() + seconds * 1000));
}

function toJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}
