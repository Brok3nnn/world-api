import type { Result } from "@repo/core/result";
import type { JsonValue } from "../engine/json-value";

/** The current value of an endpoint: the `data` of its envelope. */
export type EndpointData = { readonly [field: string]: JsonValue };

/** Why another endpoint's value could not be read: it has none, or reading it would loop. */
export interface EndpointReadFailure {
  readonly code: "endpoint_unavailable" | "limit_exceeded";
}

/** Reads the current value of another endpoint, named `@owner/slug`. This is how a mix works. */
export type EndpointReader = (ref: string) => Promise<Result<EndpointData, EndpointReadFailure>>;
