import type { Clock } from "@repo/core/time/clock";
import type { EndpointReader } from "../ports/endpoint-reader";
import type { SourceFetch } from "../ports/source-fetch";

/** Everything a run may reach outside itself. The engine reads nothing else. */
export interface RunDeps {
  readonly fetch: SourceFetch;
  readonly readEndpoint: EndpointReader;
  readonly clock: Clock;
}
