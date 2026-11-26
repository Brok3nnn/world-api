import { z } from "zod";
import { integerText } from "./integer-text";
import { maxPriceSchema } from "./max-price";
import { shapeSchema } from "./shape";

const MAX_AGE_LIMIT_S = 31_536_000;

/**
 * The query parameters of `GET /@{owner}/{slug}`, parsed from their text form. An endpoint has
 * no parameters of its own, so any other parameter is rejected.
 */
export const callParametersSchema = z.strictObject({
  shape: shapeSchema.default("json"),
  /** Accept a value at most this many seconds old. */
  max_age: integerText({ min: 1, max: MAX_AGE_LIMIT_S }).optional(),
  /** Cost cap in credits; a more expensive answer is refused instead of served. */
  max_price: maxPriceSchema.optional(),
});

export type CallParameters = z.infer<typeof callParametersSchema>;
