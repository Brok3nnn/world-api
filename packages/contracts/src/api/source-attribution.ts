import { z } from "zod";
import { httpsUrlSchema } from "./https-url";

/**
 * The credit one source gets next to a value: its name, where it is published, the licence its
 * data is used under, and the attribution text that licence requires, or `null` when it
 * requires none.
 */
export const sourceAttributionSchema = z.strictObject({
  name: z.string().min(1),
  url: httpsUrlSchema,
  licence: z.string().min(1),
  attribution: z.string().min(1).nullable(),
});
