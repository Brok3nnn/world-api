import type { GatewayDeps } from "./gateway-deps";
import { LOG_EVENTS } from "./log-events";
import { assignRequestId } from "./pipeline/assign-request-id";
import { errorResponse } from "./responses/error-response";
import { buildStatusRoute } from "./routes/build-status";
import { endpointValueRoute } from "./routes/endpoint-value";
import { healthzRoute } from "./routes/healthz";
import type { ClientConnection, Route } from "./routes/route";
import { searchRoute } from "./routes/search";

/** The whole gateway as one Web-standard function, so any runtime can serve it. */
export type Gateway = (request: Request, client?: ClientConnection) => Promise<Response>;

/** Every route of the data API, in the order they are tried. */
const ROUTES: readonly Route[] = [healthzRoute, searchRoute, buildStatusRoute, endpointValueRoute];

/** The route for a request, or the contract error a request without one gets. */
async function answer(
  request: Request,
  requestId: string,
  app: {
    readonly deps: GatewayDeps;
    readonly routes: readonly Route[];
    readonly client: ClientConnection;
  },
): Promise<Response> {
  const route = app.routes.find((candidate) => candidate.matches(new URL(request.url).pathname));
  if (route === undefined || request.method !== "GET") {
    return errorResponse({
      code: "not_found",
      message: "There is no such route.",
      hint: "The data API answers GET requests on the routes of its reference.",
    });
  }
  return route.handle(request, { requestId, deps: app.deps, client: app.client });
}

/**
 * Builds the gateway from its ports. Every response carries `x-request-id`, and the one place
 * that catches turns a defect into `500 internal_error`, with no detail for the caller.
 */
export function createApp(deps: GatewayDeps, routes: readonly Route[] = ROUTES): Gateway {
  return async (request, client = { address: "unknown" }) => {
    const requestId = assignRequestId(deps.random);
    let response: Response;
    try {
      response = await answer(request, requestId, { deps, routes, client });
    } catch (error) {
      // Defects only: every expected outcome is a value. The path is logged, never the query.
      deps.logger.log("error", LOG_EVENTS.defect, {
        request_id: requestId,
        path: new URL(request.url).pathname,
        error: error instanceof Error ? error.name : "unknown",
      });
      response = errorResponse({
        code: "internal_error",
        message: "Something went wrong on our side.",
      });
    }
    response.headers.set("x-request-id", requestId);
    return response;
  };
}
