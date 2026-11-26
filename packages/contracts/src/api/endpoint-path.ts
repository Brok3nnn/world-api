import { z } from "zod";

/** An account handle as it appears after `@` in a URL: 2 to 32 of `a-z`, `0-9` and `_`. */
export const handleSchema = z.string().regex(/^[a-z0-9_]{2,32}$/);

const SLUG_MAX_LENGTH = 64;

/** An endpoint slug: lowercase words of `a-z` and `0-9` joined by single hyphens, at most 64. */
export const slugSchema = z
  .string()
  .max(SLUG_MAX_LENGTH)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

/** The two path segments of `GET /@{owner}/{slug}`. */
export const endpointPathSchema = z.strictObject({
  owner: handleSchema,
  slug: slugSchema,
});

export type EndpointPath = z.infer<typeof endpointPathSchema>;

/**
 * An endpoint written as one reference, `@owner/slug`, the way a recipe names another
 * endpoint. The two parts follow the same grammar as the path segments.
 */
export const endpointRefSchema = z.string().refine((reference) => {
  const [owner, slug, ...rest] = reference.slice(1).split("/");
  return (
    reference.startsWith("@") &&
    rest.length === 0 &&
    handleSchema.safeParse(owner).success &&
    slugSchema.safeParse(slug).success
  );
});
