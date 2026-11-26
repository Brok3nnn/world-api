import { type AnyColumn, type SQL, sql } from "drizzle-orm";

/**
 * A check that a text column holds one of a closed list of values. The list comes from the
 * contract schema, so the database and the contracts can never disagree. Only for constant
 * lists in table definitions: the values are written into the constraint, never bound.
 */
export function oneOf(column: AnyColumn, values: readonly string[]): SQL {
  const literals = values.map((value) => sql.raw(`'${value.replaceAll("'", "''")}'`));
  return sql`${column} in (${sql.join(literals, sql`, `)})`;
}
