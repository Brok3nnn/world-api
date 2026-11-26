import type { z } from "zod";

/**
 * Parses a value read from the database with its contract schema. The database only ever
 * receives values that passed the same schema, so a failure here is a defect, not an outcome.
 */
export function parseStored<Schema extends z.ZodType>(
  schema: Schema,
  value: unknown,
  what: string,
): z.infer<Schema> {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new Error(`Stored ${what} does not match its contract.`, { cause: parsed.error });
  }
  return parsed.data;
}
