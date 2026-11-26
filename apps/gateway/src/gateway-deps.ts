import type { IdGenerator } from "@repo/core/ids/id-generator";
import type { RandomSource } from "@repo/core/ids/random-source";
import type { Logger } from "@repo/core/log/logger";
import type { Clock } from "@repo/core/time/clock";
import type { BuildQueue } from "./ports/build-queue";
import type { CallerDirectory } from "./ports/caller-directory";
import type { CatalogSearch } from "./ports/catalog-search";
import type { EndpointDirectory } from "./ports/endpoint-directory";
import type { EndpointStatusStore } from "./ports/endpoint-status-store";
import type { RateLimiter } from "./ports/rate-limiter";
import type { RecipeRunner } from "./ports/recipe-runner";
import type { RefreshLock } from "./ports/refresh-lock";
import type { UsageSink } from "./ports/usage-sink";
import type { ValueStore } from "./ports/value-store";

/** The ports the gateway is built from; entries choose the adapters, tests pass fakes. */
export interface GatewayDeps {
  readonly random: RandomSource;
  readonly logger: Logger;
  readonly endpoints: EndpointDirectory;
  readonly values: ValueStore;
  readonly clock: Clock;
  readonly ids: IdGenerator;
  readonly runner: RecipeRunner;
  readonly statuses: EndpointStatusStore;
  readonly locks: RefreshLock;
  readonly callers: CallerDirectory;
  readonly rateLimiter: RateLimiter;
  readonly usage: UsageSink;
  readonly search: CatalogSearch;
  readonly builds: BuildQueue;
}
