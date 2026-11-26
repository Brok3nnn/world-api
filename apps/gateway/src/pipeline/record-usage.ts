import type { ErrorCode } from "@repo/contracts/api/error";
import type { Shape } from "@repo/contracts/api/shape";
import type { GatewayDeps } from "../gateway-deps";
import { LOG_EVENTS } from "../log-events";
import type { ServedEndpoint } from "../ports/endpoint-directory";

/** How one call of an endpoint ended. */
export interface CallOutcome {
  readonly endpoint: ServedEndpoint;
  readonly shape: Shape;
  readonly outcome: "served" | ErrorCode;
  readonly refreshed: boolean;
  readonly startedAt: Date;
}

/**
 * Records the call as one usage event without making the response wait for it. Only a served
 * value carries a price; a write that fails is logged as one event and changes nothing else.
 */
export function recordUsage(call: CallOutcome, deps: GatewayDeps): void {
  const served = call.outcome === "served";
  const event = {
    id: deps.ids.newId("usageEvent"),
    endpointId: call.endpoint.id,
    callerId: null,
    outcome: call.outcome,
    shape: call.shape,
    priceCredits: served ? call.endpoint.definition.price_credits : 0,
    latencyMs: deps.clock.now().getTime() - call.startedAt.getTime(),
    refreshed: call.refreshed,
  };
  void deps.usage.record(event).then((recorded) => {
    if (!recorded.ok) {
      deps.logger.log("warn", LOG_EVENTS.usageUnrecorded, {
        endpoint_id: event.endpointId,
        outcome: event.outcome,
      });
    }
  });
}
