import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createIdGenerator } from "@repo/core/ids/create-id-generator";
import { parseId } from "@repo/core/ids/id";
import { err } from "@repo/core/result";
import type { Clock } from "@repo/core/time/clock";
import type { Database } from "@repo/db/client/database";
import { openInProcessDatabase } from "@repo/db/client/in-process-database";
import { readLatestValue } from "@repo/db/queries/value/read-latest-value";
import { usageEvents } from "@repo/db/schema/usage-events-table";
import { valuesHistory } from "@repo/db/schema/values-history-table";
import { CATALOG_ENDPOINTS } from "@repo/db/seed/catalog/catalog-endpoints";
import { seedDatabase } from "@repo/db/seed/seed-database";
import { nodeHttpClient } from "@repo/recipes/adapters/node-http-client";
import { createNodeResolveHost } from "@repo/recipes/adapters/node-resolve-host";
import { timersWait } from "@repo/recipes/adapters/timers-wait";
import { userAgentFor } from "@repo/recipes/egress/user-agent";
import type { HttpClient } from "@repo/recipes/ports/http-client";
import { createEngineRecipeRunner } from "../adapters/engine/engine-recipe-runner";
import { createAnonymousCallerDirectory } from "../adapters/memory/anonymous-caller-directory";
import { createMemoryRateLimiter } from "../adapters/memory/memory-rate-limiter";
import { createMemoryRefreshLock } from "../adapters/memory/memory-refresh-lock";
import { createMemorySourceRateLimiter } from "../adapters/memory/memory-source-rate-limiter";
import { createPostgresBuildQueue } from "../adapters/postgres/postgres-build-queue";
import { createPostgresCatalogSearch } from "../adapters/postgres/postgres-catalog-search";
import { createPostgresEndpointDirectory } from "../adapters/postgres/postgres-endpoint-directory";
import { createPostgresEndpointStatusStore } from "../adapters/postgres/postgres-endpoint-status-store";
import { createPostgresUsageSink } from "../adapters/postgres/postgres-usage-sink";
import { createPostgresValueStore } from "../adapters/postgres/postgres-value-store";
import { createStdoutLogger } from "../adapters/stdout/stdout-logger";
import { createApp } from "../app";
import { type GatewayEnvironment, readGatewayEnvironment } from "../env";
import type { ProofProbe, ProofWorld, ProvenEndpoint, Verdict } from "./proof-world";
import { proofVerdict, proveGateway } from "./prove-gateway";
import { renderGatewayReport } from "./render-gateway-report";

/** Each ending of the proof has its own exit code; 2 is a missing configuration. */
const EXIT_CODE: Record<Verdict, number> = { pass: 0, failed: 1, unreachable: 3 };
const MISSING_CONFIGURATION = 2;

function environmentOrExit(): Readonly<GatewayEnvironment> {
  try {
    return readGatewayEnvironment();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : "Invalid configuration."}\n`);
    return process.exit(MISSING_CONFIGURATION);
  }
}

type CatalogEndpoint = (typeof CATALOG_ENDPOINTS)[number];

function proven({ id, definition, recipe }: CatalogEndpoint): ProvenEndpoint {
  const endpointId = parseId("endpoint", id);
  if (!endpointId.ok) {
    throw new Error(`The catalog seed ${id} has no endpoint id.`);
  }
  const hosts = recipe.steps.flatMap((step) =>
    step.use === "http.get" ? [new URL(step.url).hostname] : [],
  );
  const { owner, slug, freshness, output_spec: outputSpec } = definition;
  return { id: endpointId.value, owner, slug, freshness, outputSpec, hosts };
}

/** The evidence the database holds, read without filters: the proof's database is small. */
function databaseProbe(db: Database): ProofProbe {
  return {
    async historyCount(endpointId) {
      const rows = await db.select({ endpoint: valuesHistory.endpoint_id }).from(valuesHistory);
      return rows.filter((row) => row.endpoint === endpointId).length;
    },
    async lastUsage(endpointId) {
      const rows = await db.select().from(usageEvents);
      const last = rows
        .filter((row) => row.endpoint_id === endpointId)
        .sort((first, second) => first.created_at.getTime() - second.created_at.getTime())
        .at(-1);
      return last === undefined
        ? null
        : { outcome: last.outcome, priceCredits: last.price_credits };
    },
    lastError: async (endpointId) => (await readLatestValue(db, endpointId))?.last_error ?? null,
  };
}

const environment = environmentOrExit();
const ranAt = new Date();
let offsetMs = 0;
const clock: Clock = { now: () => new Date(Date.now() + offsetMs) };
const failedHosts = new Set<string>();
const http: HttpClient = (request) =>
  failedHosts.has(new URL(request.url).hostname)
    ? Promise.resolve(err({ code: "fetch_failed" }))
    : nodeHttpClient(request);
const random = { bytes: (length: number) => crypto.getRandomValues(new Uint8Array(length)) };

const { db, close } = await openInProcessDatabase();
await seedDatabase(db);
const world: ProofWorld = {
  gateway: createApp({
    random,
    logger: createStdoutLogger({
      app: "gateway",
      level: "warn",
      clock,
      write: (line) => process.stderr.write(line),
    }),
    endpoints: createPostgresEndpointDirectory(db),
    values: createPostgresValueStore(db),
    clock,
    ids: createIdGenerator({ clock, random }),
    runner: createEngineRecipeRunner({
      http,
      resolveHost: createNodeResolveHost(),
      wait: timersWait,
      userAgent: userAgentFor(environment.USER_AGENT_CONTACT),
      clock,
      limiter: createMemorySourceRateLimiter(clock),
    }),
    statuses: createPostgresEndpointStatusStore(db),
    // One process, and the in-process database has one connection.
    locks: createMemoryRefreshLock(),
    callers: createAnonymousCallerDirectory(),
    rateLimiter: createMemoryRateLimiter(clock),
    usage: createPostgresUsageSink(db),
    search: createPostgresCatalogSearch(db),
    builds: createPostgresBuildQueue(db),
  }),
  probe: databaseProbe(db),
  advance: (seconds) => {
    offsetMs += seconds * 1000;
  },
  failHost: (host) => failedHosts.add(host),
};

const catalog = CATALOG_ENDPOINTS.map(proven);
const bySlug = (slug: string) => catalog.find((endpoint) => endpoint.slug === slug);
const stale = bySlug("topeka-weather");
const failing = bySlug("treasury-interest-rates");
if (stale === undefined || failing === undefined) {
  throw new Error("The catalog seed lacks an endpoint the proof makes stale or failing.");
}
const demonstrations = await proveGateway(world, { catalog, stale, failing });
await close();
const verdict = proofVerdict(demonstrations);
const report = renderGatewayReport({
  demonstrations,
  commit: execFileSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim(),
  ranAt,
  verdict,
});
const file = join(process.argv[2] ?? ".", `proof-b-${ranAt.toISOString().slice(0, 10)}.md`);
await writeFile(file, `${report}\n`, "utf8");
process.stdout.write(`${report}\n\nReport written to ${file}.\n`);
process.exitCode = EXIT_CODE[verdict];
