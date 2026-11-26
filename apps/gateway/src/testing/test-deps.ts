import { ENDPOINT_DEFINITION_EXAMPLE } from "@repo/contracts/endpoint/examples/endpoint-definition-example";
import { RECIPE_EXAMPLE } from "@repo/contracts/recipe/examples/recipe-example";
import { recipeSchema } from "@repo/contracts/recipe/recipe-schema";
import { createIdGenerator } from "@repo/core/ids/create-id-generator";
import { parseId } from "@repo/core/ids/id";
import { createFakeRandomSource } from "@repo/core/ids/testing/fake-random-source";
import { createRecordingLogger } from "@repo/core/log/testing/recording-logger";
import { createFakeClock } from "@repo/core/time/testing/fake-clock";
import { createAnonymousCallerDirectory } from "../adapters/memory/anonymous-caller-directory";
import { createMemoryBuildQueue } from "../adapters/memory/memory-build-queue";
import { createMemoryCatalogSearch } from "../adapters/memory/memory-catalog-search";
import { createMemoryEndpointDirectory } from "../adapters/memory/memory-endpoint-directory";
import { createMemoryEndpointStatusStore } from "../adapters/memory/memory-endpoint-status-store";
import { createMemoryRateLimiter } from "../adapters/memory/memory-rate-limiter";
import { createMemoryRefreshLock } from "../adapters/memory/memory-refresh-lock";
import { createMemoryUsageSink } from "../adapters/memory/memory-usage-sink";
import { createMemoryValueStore } from "../adapters/memory/memory-value-store";
import type { GatewayDeps } from "../gateway-deps";
import type { ServedEndpoint } from "../ports/endpoint-directory";
import { createFakeRecipeRunner } from "../ports/testing/fake-recipe-runner";
import type { StoredValue } from "../ports/value-store";

/** A typed id for test data; a malformed one is a mistake in the test. */
export function testId<
  Kind extends "endpoint" | "recipeVersion" | "source" | "value" | "usageEvent",
>(kind: Kind, value: string) {
  const id = parseId(kind, value);
  if (!id.ok) {
    throw new Error(`${value} is not a ${kind} id.`);
  }
  return id.value;
}

/** The time the gateway's tests run at. */
const TEST_NOW = new Date("2026-11-22T10:00:00.000Z");

/** A live public endpoint, `@core/weather-now-vienna`, with its recipe and one green source. */
export function servedEndpoint(
  overrides: Partial<ServedEndpoint["definition"]> = {},
): ServedEndpoint {
  return {
    id: testId("endpoint", `ep_${overrides.slug?.replaceAll("-", "_") ?? "weather_now_vienna"}`),
    definition: { ...ENDPOINT_DEFINITION_EXAMPLE, ...overrides },
    recipe: {
      id: testId("recipeVersion", "rv_weather_1"),
      document: recipeSchema.parse(RECIPE_EXAMPLE),
    },
    sources: [
      {
        id: testId("source", "src_weather"),
        name: "Weather service",
        hosts: ["api.example.org"],
        url: "https://example.org/docs/weather",
        licence: "CC BY 4.0",
        attribution: "Weather data: Weather service, CC BY 4.0",
        tier: "green",
        policyCheckedAt: new Date("2026-11-01T00:00:00Z"),
        rateLimitPerMin: 60,
      },
    ],
  };
}

/** A value of the test endpoint, fetched `ageS` seconds before `TEST_NOW`. */
export function storedValue(ageS: number): StoredValue {
  const fetchedAt = new Date(TEST_NOW.getTime() - ageS * 1000);
  return {
    data: { temperature_c: 4.2 },
    asOf: new Date(fetchedAt.getTime() - 60_000),
    fetchedAt,
    expiresAt: new Date(fetchedAt.getTime() + 900_000),
    recipeVersionId: testId("recipeVersion", "rv_weather_1"),
  };
}

/** A value store that holds `value` as the latest value of the test endpoint. */
export function valuesWith(value: StoredValue) {
  return createMemoryValueStore(
    new Map([[servedEndpoint().id, { value, consecutiveFailures: 0 }]]),
  );
}

/** The gateway's ports, with fakes and in-memory adapters; any of them can be replaced. */
export function testDeps(overrides: Partial<GatewayDeps> = {}): GatewayDeps {
  const clock = overrides.clock ?? createFakeClock(TEST_NOW);
  return {
    random: createFakeRandomSource(),
    logger: createRecordingLogger(),
    endpoints: createMemoryEndpointDirectory([servedEndpoint()]),
    values: createMemoryValueStore(),
    clock,
    ids: createIdGenerator({ clock, random: createFakeRandomSource(1000) }),
    runner: createFakeRecipeRunner(),
    statuses: createMemoryEndpointStatusStore([[servedEndpoint().id, "live"]]),
    locks: createMemoryRefreshLock(),
    callers: createAnonymousCallerDirectory(),
    rateLimiter: createMemoryRateLimiter(clock),
    usage: createMemoryUsageSink(),
    search: createMemoryCatalogSearch([servedEndpoint()]),
    builds: createMemoryBuildQueue([]),
    ...overrides,
  };
}
