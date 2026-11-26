import { z } from "zod";

interface IntegerRange {
  readonly min: number;
  readonly max: number;
}

/**
 * A whole number written as text, the way it arrives in a query string, within a range. Signs,
 * leading zeros, decimals, exponents and spaces are not accepted.
 */
export function integerText(range: IntegerRange) {
  return z
    .string()
    .regex(/^(0|[1-9][0-9]{0,8})$/)
    .transform(Number)
    .pipe(z.int().min(range.min).max(range.max));
}
