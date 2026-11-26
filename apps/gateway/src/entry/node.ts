import type { RandomSource } from "@repo/core/ids/random-source";
import type { Clock } from "@repo/core/time/clock";
import { openInProcessDatabase } from "@repo/db/client/in-process-database";
import { CATALOG_ENDPOINTS } from "@repo/db/seed/catalog/catalog-endpoints";
import { nodeHttpClient } from "@repo/recipes/adapters/node-http-client";
import { createNodeResolveHost } from "@repo/recipes/adapters/node-resolve-host";
import { timersWait } from "@repo/recipes/adapters/timers-wait";
import { userAgentFor } from "@repo/recipes/egress/user-agent";
import { createStdoutLogger } from "../adapters/stdout/stdout-logger";
import { readGatewayEnvironment } from "../env";
import { LOG_EVENTS } from "../log-events";
import { createLocalGateway } from "./local-gateway";
import { serveNode } from "./node-server";

/** Where the gateway listens when it runs on Node locally. */
const LOCAL_PORT = 8787;

const environment = readGatewayEnvironment();
const clock: Clock = { now: () => new Date() };
const random: RandomSource = { bytes: (length) => crypto.getRandomValues(new Uint8Array(length)) };
const logger = createStdoutLogger({
  app: "gateway",
  level: environment.LOG_LEVEL,
  clock,
  write: (line) => process.stdout.write(line),
});

// An in-process Postgres, migrated and seeded on every start: values live as long as the process.
const { db } = await openInProcessDatabase();
const gateway = await createLocalGateway({
  db,
  clock,
  random,
  logger,
  egress: {
    http: nodeHttpClient,
    resolveHost: createNodeResolveHost(),
    wait: timersWait,
    userAgent: userAgentFor(environment.USER_AGENT_CONTACT),
  },
});

await serveNode(gateway, LOCAL_PORT);
logger.log("info", LOG_EVENTS.started, {
  url: `http://127.0.0.1:${LOCAL_PORT}`,
  endpoints: CATALOG_ENDPOINTS.length,
});
