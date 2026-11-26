import { z } from "zod";

/** How old a value may be before it is refreshed: one minute up to one day. */
export const freshnessSchema = z.enum(["1m", "5m", "15m", "1h", "1d"]);

export type Freshness = z.infer<typeof freshnessSchema>;
