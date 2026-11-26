/**
 * The members of a closed list from the contracts as the non-empty tuple the schema library
 * needs for a text column with a fixed set of values.
 */
export function enumValues<Value extends string>(list: {
  readonly options: readonly Value[];
}): [Value, ...Value[]] {
  const [first, ...rest] = list.options;
  if (first === undefined) {
    throw new Error("A closed list needs at least one value.");
  }
  return [first, ...rest];
}
