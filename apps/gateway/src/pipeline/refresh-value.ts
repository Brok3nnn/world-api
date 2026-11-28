import { envelopeSchema } from "@repo/contracts/api/envelope";
import { FRESHNESS_SECONDS } from "@repo/core/freshness/freshness-seconds";
import { nextRefresh } from "@repo/core/freshness/next-refresh";
import { withinGrace } from "@repo/core/freshness/within-grace";
import { err, ok, type Result } from "@repo/core/result";
import { nextEndpointStatus } from "@repo/core/status/next-endpoint-status";
import { applyFirewall } from "@repo/recipes/firewall/apply-firewall";
import type { EndpointReader } from "@repo/recipes/ports/endpoint-reader";
import type { GatewayDeps } from "../gateway-deps";
import { LOG_EVENTS } from "../log-events";
import type { ServedEndpoint } from "../ports/endpoint-directory";
import type { LatestValue, StoredValue } from "../ports/value-store";
import type { ErrorAnswer } from "../responses/error-response";
import { usableSources } from "./usable-sources";

/** What refreshing needs: the gateway's ports, and how this run reads other endpoints. */
type RefreshDeps = Pick<
  GatewayDeps,
  "runner" | "values" | "ids" | "clock" | "logger" | "statuses"
> & {
  readonly readEndpoint: EndpointReader;
};

const DEGRADED: ErrorAnswer = {
  code: "degraded",
  message: "The source of this endpoint failed and no acceptable value exists.",
  hint: "Try again later.",
};

/** The same outcome when a source may not be read at all, so trying again cannot help. */
const SOURCE_NOT_USABLE: ErrorAnswer = {
  code: "degraded",
  message: "A source of this endpoint may not be read, and no acceptable value exists.",
  hint: "A source is read only while its terms were checked within the last 90 days. Retrying does not help until that check is renewed.",
};

/**
 * Runs the active recipe, passes its value through the output firewall, and stores it as the
 * latest value and in the history. A failure is a code and a step, never a value.
 */
async function produce(
  endpoint: ServedEndpoint,
  deps: RefreshDeps,
): Promise<Result<StoredValue, string>> {
  if (endpoint.recipe === null) {
    return err("no_active_recipe");
  }
  const run = await deps.runner.run({
    recipe: endpoint.recipe.document,
    sources: usableSources(endpoint.sources, deps.clock.now()),
    readEndpoint: deps.readEndpoint,
  });
  if (!run.ok) {
    return err(`${run.error.code} at ${run.error.step}`);
  }
  const checked = applyFirewall(run.value.data, endpoint.definition.output_spec);
  if (!checked.ok) {
    return err("output_firewall");
  }
  const fetchedAt = deps.clock.now();
  const value: StoredValue = {
    data: envelopeSchema.shape.data.parse(checked.value),
    asOf: run.value.asOf,
    fetchedAt,
    expiresAt: nextRefresh(fetchedAt, endpoint.definition.freshness),
    recipeVersionId: endpoint.recipe.id,
  };
  await deps.values.storeRefreshed(endpoint.id, value);
  await deps.values.appendHistory({
    id: deps.ids.newId("value"),
    endpointId: endpoint.id,
    data: value.data,
    asOf: value.asOf,
    recipeVersionId: value.recipeVersionId,
  });
  return ok(value);
}

/**
 * Moves the endpoint as the refresh outcome demands: `degraded` after the third failure in a
 * row, `live` after a success. Another instance may have moved it already; then nothing changes.
 */
async function settleStatus(
  endpoint: ServedEndpoint,
  outcome: { readonly succeeded: boolean; readonly failures: number },
  deps: RefreshDeps,
): Promise<void> {
  const from = endpoint.definition.status;
  const to = nextEndpointStatus(from, outcome.succeeded ? "success" : "failure", outcome.failures);
  if (to !== from && (await deps.statuses.move(endpoint.id, from, to))) {
    deps.logger.log("info", LOG_EVENTS.statusChanged, { endpoint_id: endpoint.id, from, to });
  }
}

/**
 * Refreshes the endpoint's value. When that fails, the failure is counted and logged, and the
 * stored value is served while it is within its grace period; otherwise the call is
 * `503 degraded`, which is never charged. A value the firewall refuses is neither stored nor
 * returned.
 */
export async function refreshValue(
  endpoint: ServedEndpoint,
  latest: LatestValue,
  deps: RefreshDeps,
): Promise<Result<StoredValue, ErrorAnswer>> {
  const produced = await produce(endpoint, deps);
  if (produced.ok) {
    await settleStatus(endpoint, { succeeded: true, failures: 0 }, deps);
    return produced;
  }
  const failures = await deps.values.recordFailure(endpoint.id, produced.error);
  deps.logger.log("info", LOG_EVENTS.refreshFailed, {
    endpoint_id: endpoint.id,
    error: produced.error,
    consecutive_failures: failures,
  });
  await settleStatus(endpoint, { succeeded: false, failures }, deps);
  return servedWithinGrace(endpoint, latest, deps.clock.now());
}

/**
 * The stored value while it is within its grace period, or `503 degraded`, which says so when a
 * source of the endpoint may not be read, such as one whose terms check is over 90 days old.
 */
export function servedWithinGrace(
  endpoint: ServedEndpoint,
  latest: LatestValue,
  now: Date,
): Result<StoredValue, ErrorAnswer> {
  const stored = latest.value;
  if (stored !== null && withinGrace(stored.fetchedAt, endpoint.definition.freshness, now)) {
    return ok(stored);
  }
  const unusable = usableSources(endpoint.sources, now).length < endpoint.sources.length;
  // A newer value can exist one freshness interval from now at the soonest.
  return err({
    ...(unusable ? SOURCE_NOT_USABLE : DEGRADED),
    retryAfterS: FRESHNESS_SECONDS[endpoint.definition.freshness],
  });
}
