import { z } from "zod";

const QUERY_MAX_LENGTH = 200;

/**
 * What a person or an agent typed: trimmed, 1 to 200 characters. A NUL character is refused,
 * as Postgres cannot store it in text.
 */
export const queryTextSchema = z
  .string()
  .trim()
  .min(1)
  .max(QUERY_MAX_LENGTH)
  .refine((text) => !text.includes("\u0000"));
