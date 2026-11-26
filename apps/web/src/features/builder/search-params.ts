import type { Route } from "next";
import {
  createSerializer,
  type inferParserType,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";
import { REFRESH_INTERVAL_IDS } from "@/features/catalog/constants";
import { BUILDER_MODES, REQUESTED_SHAPES, SOURCE_MIX_OPTIONS } from "./constants";

/**
 * URL contract of the /create page. The home composer, the command menu and search all link
 * into the builder through `builderUrl`, so the shape of these params is defined only here.
 */
export const builderSearchParams = {
  mode: parseAsStringLiteral(BUILDER_MODES).withDefault("request"),
  q: parseAsString.withDefault(""),
  sources: parseAsStringLiteral(SOURCE_MIX_OPTIONS).withDefault("auto"),
  shape: parseAsStringLiteral(REQUESTED_SHAPES).withDefault("json"),
  refresh: parseAsStringLiteral(REFRESH_INTERVAL_IDS).withDefault("15m"),
};

export type BuilderParams = inferParserType<typeof builderSearchParams>;

const serializeBuilderParams = createSerializer(builderSearchParams, { clearOnDefault: true });

/** e.g. builderUrl({ q: "rain in Vienna", shape: "probability" }) → "/create?q=rain+in+Vienna&shape=probability" */
export function builderUrl(params: Partial<BuilderParams> = {}): Route {
  // The serializer only appends known query params to a static route, so the result is a valid Route.
  return serializeBuilderParams("/create", params) as Route;
}
