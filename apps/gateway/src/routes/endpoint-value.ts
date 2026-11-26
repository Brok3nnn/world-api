import { ok, type Result } from "@repo/core/result";
import type { GatewayDeps } from "../gateway-deps";
import { buildEnvelope } from "../pipeline/build-envelope";
import { guardPrice } from "../pipeline/guard-price";
import { limitRate } from "../pipeline/limit-rate";
import { type ParsedCall, parseRequest } from "../pipeline/parse-request";
import { readValue } from "../pipeline/read-value";
import { recordUsage } from "../pipeline/record-usage";
import { refreshOnce } from "../pipeline/refresh-once";
import { renderShape } from "../pipeline/render-shape";
import { resolveEndpoint } from "../pipeline/resolve-endpoint";
import type { ServedEndpoint } from "../ports/endpoint-directory";
import type { ErrorAnswer } from "../responses/error-response";
import { errorResponse } from "../responses/error-response";
import type { Route } from "./route";

/**
 * Serves a resolved endpoint: the price guard, the value (refreshed once if it must be) and its
 * shape. Says whether this call refreshed the value.
 */
async function serveResolved(
  endpoint: ServedEndpoint,
  call: ParsedCall,
  deps: GatewayDeps,
): Promise<{ readonly answer: Result<Response, ErrorAnswer>; readonly refreshed: boolean }> {
  const affordable = guardPrice(endpoint, call.parameters.max_price);
  if (!affordable.ok) {
    return { answer: affordable, refreshed: false };
  }
  const reading = await readValue(endpoint, call.parameters.max_age, deps);
  const chain = [`@${call.path.owner}/${call.path.slug}`];
  const value = reading.fresh
    ? ok(reading.value)
    : await refreshOnce(endpoint, { maxAgeS: call.parameters.max_age, chain }, deps);
  if (!value.ok) {
    return { answer: value, refreshed: !reading.fresh };
  }
  const envelope = buildEnvelope(endpoint, value.value);
  const answer = renderShape(endpoint, envelope, {
    shape: call.parameters.shape,
    now: deps.clock.now(),
  });
  return { answer, refreshed: !reading.fresh };
}

/**
 * `GET /@{owner}/{slug}`: the current value of one endpoint in the shape the call asks for; a
 * value that is not fresh enough is refreshed first.
 */
export const endpointValueRoute: Route = {
  matches: (pathname) => pathname.startsWith("/@"),
  handle: async (request, { deps, client }) => {
    const startedAt = deps.clock.now();
    const call = parseRequest(request);
    if (!call.ok) {
      return errorResponse(call.error);
    }
    const caller = await deps.callers.identify(request, client);
    const allowed = await limitRate(caller, deps.rateLimiter);
    if (!allowed.ok) {
      return errorResponse(allowed.error);
    }
    const endpoint = await resolveEndpoint(call.value.path, deps.endpoints);
    if (!endpoint.ok) {
      return errorResponse(endpoint.error);
    }
    const served = await serveResolved(endpoint.value, call.value, deps);
    recordUsage(
      {
        endpoint: endpoint.value,
        shape: call.value.parameters.shape,
        outcome: served.answer.ok ? "served" : served.answer.error.code,
        refreshed: served.refreshed,
        startedAt,
      },
      deps,
    );
    return served.answer.ok ? served.answer.value : errorResponse(served.answer.error);
  },
};
