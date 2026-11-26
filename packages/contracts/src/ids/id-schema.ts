import { z } from "zod";

/**
 * Typed prefix of every entity id. An id is its prefix, an underscore and an opaque body, for
 * example `ep_7f3k2m`. The list mirrors the primary-key rule in
 * docs/architecture/data-model.md.
 */
export const ID_PREFIXES = {
  account: "acc",
  source: "src",
  endpoint: "ep",
  recipeVersion: "rv",
  value: "val",
  build: "bld",
  buildEvent: "bev",
  usageEvent: "use",
} as const;

export type IdKind = keyof typeof ID_PREFIXES;

/** The opaque part after the prefix: lowercase letters, digits and underscores. */
const ID_BODY = "[0-9a-z_]{1,64}";

/** Schema of an id of one kind: `idSchema("endpoint")` accepts `ep_7f3k2m` and nothing else. */
export function idSchema(kind: IdKind): z.ZodString {
  return z.string().regex(new RegExp(`^${ID_PREFIXES[kind]}_${ID_BODY}$`));
}
