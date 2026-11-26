import { z } from "zod";

/** The state of an endpoint. Only a `live` or `degraded` endpoint answers calls. */
export const endpointStatusSchema = z.enum(["building", "live", "degraded", "disabled"]);

export type EndpointStatus = z.infer<typeof endpointStatusSchema>;
