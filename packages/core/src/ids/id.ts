import { type IdKind, idSchema } from "@repo/contracts/ids";
import { err, ok, type Result } from "../result/result";

declare const idKind: unique symbol;

/**
 * An id that is known to belong to one kind of entity. An endpoint id cannot be passed where a
 * build id is expected. Only `parseId` and an `IdGenerator` create one.
 */
export type Id<Kind extends IdKind> = string & { readonly [idKind]: Kind };

export type AccountId = Id<"account">;
export type SourceId = Id<"source">;
export type EndpointId = Id<"endpoint">;
export type RecipeVersionId = Id<"recipeVersion">;
export type ValueId = Id<"value">;
export type BuildId = Id<"build">;
export type BuildEventId = Id<"buildEvent">;
export type UsageEventId = Id<"usageEvent">;

export interface InvalidId {
  readonly code: "invalid_id";
  readonly kind: IdKind;
}

/** Turns untrusted input into a typed id, or says which kind it failed to be. */
export function parseId<Kind extends IdKind>(
  kind: Kind,
  value: unknown,
): Result<Id<Kind>, InvalidId> {
  const parsed = idSchema(kind).safeParse(value);
  if (!parsed.success) {
    return err({ code: "invalid_id", kind });
  }
  // Safe: the schema has just proven that the value has this kind's prefix and shape.
  return ok(parsed.data as Id<Kind>);
}
