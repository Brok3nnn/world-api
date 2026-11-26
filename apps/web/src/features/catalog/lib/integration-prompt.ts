import { siteConfig } from "@/config/site";
import { REFRESH_INTERVALS, SHAPES } from "../constants";
import type { Endpoint } from "../types";
import { endpointApiUrl } from "./endpoint-urls";

/**
 * The few lines a user pastes into their AI coding tool so it can wire up the endpoint
 * on the first try.
 */
export function buildIntegrationPrompt(endpoint: Endpoint): string {
  const shapes = endpoint.shapes.map((shape) => SHAPES[shape].label).join(", ");
  return [
    `Use this data endpoint: GET ${endpointApiUrl(endpoint)}`,
    `Endpoint: ${endpoint.title}. Refreshes ${REFRESH_INTERVALS[endpoint.refresh].label.toLowerCase()}.`,
    `Send the API key in the Authorization header as "Bearer $DATA_API_KEY".`,
    `JSON responses always contain: data, as_of, sources, next_refresh, method, price_credits.`,
    `Other shapes via ?shape= (${shapes}). Set &max_price= to cap the cost per call.`,
    `Full reference for models: ${siteConfig.llmsTxtUrl}`,
  ].join("\n");
}
