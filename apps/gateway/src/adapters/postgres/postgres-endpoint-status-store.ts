import type { Database } from "@repo/db/client/database";
import { moveEndpointStatus } from "@repo/db/queries/endpoint/move-endpoint-status";
import type { EndpointStatusStore } from "../../ports/endpoint-status-store";

/** The `EndpointStatusStore` over the `endpoints` table, guarded by the status it moves from. */
export function createPostgresEndpointStatusStore(db: Database): EndpointStatusStore {
  return {
    move: (endpointId, from, to) => moveEndpointStatus(db, { endpoint_id: endpointId, from, to }),
  };
}
