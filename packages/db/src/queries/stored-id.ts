import type { IdKind } from "@repo/contracts/ids";
import { type Id, parseId } from "@repo/core/ids/id";

/** A typed id read from the database, whose checks already guarantee its shape. */
export function storedId<Kind extends IdKind>(kind: Kind, value: string): Id<Kind> {
  const parsed = parseId(kind, value);
  if (!parsed.ok) {
    throw new Error(`Stored ${kind} id "${value}" does not match its contract.`);
  }
  return parsed.value;
}
