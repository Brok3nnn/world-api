import { OUTPUT_SPEC_EXAMPLE } from "@repo/contracts/endpoint/examples/output-spec-example";
import { VALID_RECIPE_EXAMPLES } from "@repo/contracts/recipe/examples/valid-recipes";
import { SOURCE_EXAMPLE } from "@repo/contracts/source/examples/source-example";
import type { accounts } from "../schema/accounts-table";
import type { buildEvents } from "../schema/build-events-table";
import type { builds } from "../schema/builds-table";
import type { endpoints } from "../schema/endpoints-table";
import type { recipeVersions } from "../schema/recipe-versions-table";
import type { sources } from "../schema/sources-table";
import type { usageEvents } from "../schema/usage-events-table";
import type { valuesHistory } from "../schema/values-history-table";
import type { valuesLatest } from "../schema/values-latest-table";

/** A valid account to insert, with any field replaced. */
export function accountRow(
  overrides: Partial<typeof accounts.$inferInsert> = {},
): typeof accounts.$inferInsert {
  return { id: "acc_core", handle: "core", display_name: "Core", kind: "platform", ...overrides };
}

/** A valid endpoint of the account `acc_core`, with any field replaced. */
export function endpointRow(
  overrides: Partial<typeof endpoints.$inferInsert> = {},
): typeof endpoints.$inferInsert {
  return {
    id: "ep_weather_now",
    owner_id: "acc_core",
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
    ...overrides,
  };
}

/** A valid first recipe version of `ep_weather_now`, with any field replaced. */
export function recipeVersionRow(
  overrides: Partial<typeof recipeVersions.$inferInsert> = {},
): typeof recipeVersions.$inferInsert {
  return {
    id: "rv_weather_now_1",
    endpoint_id: "ep_weather_now",
    version: 1,
    document: VALID_RECIPE_EXAMPLES.page,
    ...overrides,
  };
}

const FETCHED_AT = new Date("2026-11-21T12:00:00Z");

/** A complete latest value of `ep_weather_now` from `rv_weather_now_1`, with any field replaced. */
export function valueLatestRow(
  overrides: Partial<typeof valuesLatest.$inferInsert> = {},
): typeof valuesLatest.$inferInsert {
  return {
    endpoint_id: "ep_weather_now",
    data: { temperature_c: 6.4 },
    as_of: new Date("2026-11-21T11:59:30Z"),
    fetched_at: FETCHED_AT,
    expires_at: new Date("2026-11-21T12:15:00Z"),
    recipe_version_id: "rv_weather_now_1",
    ...overrides,
  };
}

/** A past value of `ep_weather_now`, with any field replaced. */
export function valueHistoryRow(
  overrides: Partial<typeof valuesHistory.$inferInsert> = {},
): typeof valuesHistory.$inferInsert {
  return {
    id: "val_1",
    endpoint_id: "ep_weather_now",
    data: { temperature_c: 6.4 },
    as_of: new Date("2026-11-21T11:59:30Z"),
    recipe_version_id: "rv_weather_now_1",
    ...overrides,
  };
}

/** An anonymous, served call of `ep_weather_now`, with any field replaced. */
export function usageEventRow(
  overrides: Partial<typeof usageEvents.$inferInsert> = {},
): typeof usageEvents.$inferInsert {
  return {
    id: "use_1",
    endpoint_id: "ep_weather_now",
    outcome: "served",
    shape: "json",
    price_credits: 1,
    latency_ms: 12,
    refreshed: false,
    ...overrides,
  };
}

/** A queued build requested by `acc_core`, with any field replaced. */
export function buildRow(
  overrides: Partial<typeof builds.$inferInsert> = {},
): typeof builds.$inferInsert {
  return {
    id: "bld_1",
    requester_id: "acc_core",
    request: { text: "Free spots in the car park on Main Street" },
    ...overrides,
  };
}

/** The first event of `bld_1`, with any field replaced. */
export function buildEventRow(
  overrides: Partial<typeof buildEvents.$inferInsert> = {},
): typeof buildEvents.$inferInsert {
  return {
    id: "bev_1",
    build_id: "bld_1",
    stage: "interpret",
    kind: "started",
    message: "Reading the request.",
    ...overrides,
  };
}

/** The example source of the contracts as a row, with any field replaced. */
export function sourceRow(
  overrides: Partial<typeof sources.$inferInsert> = {},
): typeof sources.$inferInsert {
  return {
    ...SOURCE_EXAMPLE,
    id: "src_weather",
    policy_checked_at: new Date(SOURCE_EXAMPLE.policy_checked_at),
    ...overrides,
  };
}
