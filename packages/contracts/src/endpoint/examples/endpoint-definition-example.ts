import type { EndpointDefinition } from "../endpoint-definition";
import { OUTPUT_SPEC_EXAMPLE } from "./output-spec-example";

/** A public catalog endpoint of the platform account. */
export const ENDPOINT_DEFINITION_EXAMPLE = {
  owner: "core",
  slug: "weather-now-vienna",
  title: "Weather now",
  summary: "Current air temperature in Vienna.",
  category: "weather",
  visibility: "public",
  status: "live",
  method: "computed",
  freshness: "15m",
  price_credits: 1,
  output_spec: OUTPUT_SPEC_EXAMPLE,
} satisfies EndpointDefinition;
