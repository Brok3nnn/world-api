import { z } from "zod";
import { integerText } from "../api/integer-text";
import { maxPriceSchema } from "../api/max-price";
import { queryTextSchema } from "../api/query-text";
import { shapeSchema } from "../api/shape";

/** The longest `GET /get` holds a request open while a build runs, in seconds. */
export const MAX_WAIT_S = 30;

/** The query parameters of `GET /get`, parsed from their text form. */
export const universalEntryParametersSchema = z.strictObject({
  q: queryTextSchema,
  shape: shapeSchema.default("json"),
  max_price: maxPriceSchema.optional(),
  /** Seconds to wait for a build before answering `202`. */
  wait: integerText({ min: 0, max: MAX_WAIT_S }).default(0),
});

export type UniversalEntryParameters = z.infer<typeof universalEntryParametersSchema>;
