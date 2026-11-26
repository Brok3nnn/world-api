import type { GatewayDeps } from "../gateway-deps";

/** The network side of a call, as the entry that received it knows it. */
export interface ClientConnection {
  readonly address: string;
}

/** What a route is given besides the request. */
interface RouteContext {
  readonly requestId: string;
  readonly deps: GatewayDeps;
  readonly client: ClientConnection;
}

/** One route of the data API: every route answers `GET` on the paths it matches. */
export interface Route {
  /** Whether the route serves this path. */
  readonly matches: (pathname: string) => boolean;
  readonly handle: (request: Request, context: RouteContext) => Promise<Response>;
}
