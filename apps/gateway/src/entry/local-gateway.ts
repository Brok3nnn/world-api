import { createIdGenerator } from "@repo/core/ids/create-id-generator";
import type { RandomSource } from "@repo/core/ids/random-source";
import type { Logger } from "@repo/core/log/logger";
import { isUsableSource } from "@repo/core/sources/usable-source";
import type { Clock } from "@repo/core/time/clock";
import type { Database } from "@repo/db/client/database";
import { CATALOG_ENDPOINTS } from "@repo/db/seed/catalog/catalog-endpoints";
import { seedDatabase } from "@repo/db/seed/seed-database";
import {
  createEngineRecipeRunner,
  type EngineRecipeRunnerDeps,
} from "../adapters/engine/engine-recipe-runner";
import { createAnonymousCallerDirectory } from "../adapters/memory/anonymous-caller-directory";
import { createMemoryRateLimiter } from "../adapters/memory/memory-rate-limiter";
import { createMemoryRefreshLock } from "../adapters/memory/memory-refresh-lock";
import { createMemorySourceRateLimiter } from "../adapters/memory/memory-source-rate-limiter";
import { createCachedEndpointDirectory } from "../adapters/postgres/cached-endpoint-directory";
import { createPostgresBuildQueue } from "../adapters/postgres/postgres-build-queue";
import { createPostgresCatalogSearch } from "../adapters/postgres/postgres-catalog-search";
import { createPostgresEndpointDirectory } from "../adapters/postgres/postgres-endpoint-directory";
import { createPostgresEndpointStatusStore } from "../adapters/postgres/postgres-endpoint-status-store";
import { createPostgresUsageSink } from "../adapters/postgres/postgres-usage-sink";
import { createPostgresValueStore } from "../adapters/postgres/postgres-value-store";
import { createApp, type Gateway } from "../app";
import { LOG_EVENTS } from "../log-events";
import type { EndpointDirectory } from "../ports/endpoint-directory";

/** What the local gateway takes from the process that runs it. */
export interface LocalGatewayDeps {
  /** A migrated database that this process alone uses. */
  readonly db: Database;
  readonly clock: Clock;
  readonly random: RandomSource;
  readonly logger: Logger;
  /** How a refresh reaches the sources: HTTP client, resolver, timers and user agent. */
  readonly egress: Omit<EngineRecipeRunnerDeps, "clock" | "limiter">;
}

/**
 * Warns once for every source of the catalog that no refresh may read, such as one whose terms
 * were checked more than 90 days ago: its endpoints answer `503 degraded` until it is renewed.
 */
async function warnOfUnusableSources(
  endpoints: EndpointDirectory,
  { clock, logger }: LocalGatewayDeps,
): Promise<void> {
  const found = await Promise.all(
    CATALOG_ENDPOINTS.map(({ definition: { owner, slug } }) => endpoints.find({ owner, slug })),
  );
  const unusable = new Map(
    found
      .flatMap((endpoint) => endpoint?.sources ?? [])
      .filter((source) => !isUsableSource(source, clock.now()))
      .map((source) => [source.id, source]),
  );
  for (const source of unusable.values()) {
    logger.log("warn", LOG_EVENTS.sourceUnusable, {
      source: source.name,
      tier: source.tier,
      policy_checked_at: source.policyCheckedAt.toISOString(),
    });
  }
}

/**
 * The gateway as `pnpm dev:gateway` runs it: the catalog seeded into the database, the Postgres
 * adapters over it and the real engine behind the egress policy. One process owns the database,
 * so the refresh lock and both rate limiters are in memory.
 */
export async function createLocalGateway(deps: LocalGatewayDeps): Promise<Gateway> {
  const { db, clock, random } = deps;
  await seedDatabase(db);
  const endpoints = createCachedEndpointDirectory(createPostgresEndpointDirectory(db), clock);
  await warnOfUnusableSources(endpoints, deps);
  return createApp({
    random,
    logger: deps.logger,
    endpoints,
    values: createPostgresValueStore(db),
    clock,
    ids: createIdGenerator({ clock, random }),
    runner: createEngineRecipeRunner({
      ...deps.egress,
      clock,
      limiter: createMemorySourceRateLimiter(clock),
    }),
    statuses: createPostgresEndpointStatusStore(db),
    locks: createMemoryRefreshLock(),
    callers: createAnonymousCallerDirectory(),
    rateLimiter: createMemoryRateLimiter(clock),
    usage: createPostgresUsageSink(db),
    search: createPostgresCatalogSearch(db),
    builds: createPostgresBuildQueue(db),
  });
}
