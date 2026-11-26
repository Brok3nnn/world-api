/**
 * The limits a recipe document must respect by its structure, enforced by the recipe schema.
 * The limits of a run (time, response size, expression cost) belong to the engine.
 */
export const RECIPE_LIMITS = {
  /** Steps per recipe. */
  steps: 12,
  /** `http.get` steps per recipe. */
  fetches: 4,
  /** Size of the document as JSON text. */
  documentBytes: 32_768,
} as const;
