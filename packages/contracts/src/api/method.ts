import { z } from "zod";

/**
 * How a value was produced. `model-estimate` marks anything a model wrote, so a caller can
 * always tell an estimate from a measurement.
 */
export const methodSchema = z.enum(["computed", "model-estimate", "owner-data"]);

export type Method = z.infer<typeof methodSchema>;
