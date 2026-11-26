import { z } from "zod";
import { instantSchema } from "./instant";
import { jsonValueSchema } from "./json-value";
import { methodSchema } from "./method";
import { sourceAttributionSchema } from "./source-attribution";

/**
 * The fixed wrapper of every successful `json` response. It has exactly these six fields; a
 * response with a missing or an extra field is not an envelope.
 */
export const envelopeSchema = z.strictObject({
  /** The value: only fields of the endpoint's output spec. */
  data: z.record(z.string(), jsonValueSchema),
  /** When the value was observed at the source. */
  as_of: instantSchema,
  /** Attribution for every source that contributed; never empty. */
  sources: z.array(sourceAttributionSchema).min(1),
  /** Earliest time a newer value can exist. */
  next_refresh: instantSchema,
  method: methodSchema,
  /** What this call cost the caller, in credits. */
  price_credits: z.int().nonnegative(),
});

export type Envelope = z.infer<typeof envelopeSchema>;
