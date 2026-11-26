/**
 * `Object.keys` typed with the record's own key union. Safe for the literal-keyed lookup tables
 * in this codebase, which never gain keys at runtime.
 */
export function keysOf<Key extends string>(record: Record<Key, unknown>): Key[] {
  return Object.keys(record) as Key[];
}
