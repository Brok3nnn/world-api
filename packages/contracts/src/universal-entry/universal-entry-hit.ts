import type { z } from "zod";
import { envelopeSchema } from "../api/envelope";
import { httpsUrlSchema } from "../api/https-url";

/**
 * The answer of `GET /get` when the catalog matched: the envelope, plus the permanent URL of
 * the endpoint that answered, to call directly from then on.
 */
export const universalEntryHitSchema = envelopeSchema.extend({
  endpoint: httpsUrlSchema,
});

export type UniversalEntryHit = z.infer<typeof universalEntryHitSchema>;
