import { z } from "zod";
import { shapeSchema } from "../api/shape";
import { freshnessSchema } from "../endpoint/freshness";
import { RECIPE_LIMITS } from "../recipe/recipe-limits";

const TEXT_MIN_LENGTH = 3;
const TEXT_MAX_LENGTH = 500;

/** How many sources a request may ask to combine: one up to the fetch limit of a recipe. */
export const sourcesCountSchema = z.int().min(1).max(RECIPE_LIMITS.fetches);

/**
 * What a person or an agent asks the builder for: the request in plain words, and the settings
 * they chose explicitly. A setting left out is read from the words by the interpret stage.
 */
export const buildRequestSchema = z.strictObject({
  text: z.string().trim().min(TEXT_MIN_LENGTH).max(TEXT_MAX_LENGTH),
  sources_count: sourcesCountSchema.optional(),
  shape: shapeSchema.optional(),
  freshness: freshnessSchema.optional(),
});

export type BuildRequest = z.infer<typeof buildRequestSchema>;
