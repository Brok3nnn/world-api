import type { EndpointStatus } from "@repo/contracts/endpoint/endpoint-status";
import type { EndpointId } from "@repo/core/ids/id";

/** Moves an endpoint between statuses, only from the status it still has; says whether it moved. */
export interface EndpointStatusStore {
  move(endpointId: EndpointId, from: EndpointStatus, to: EndpointStatus): Promise<boolean>;
}
