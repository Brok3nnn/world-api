/**
 * The limits of one run, enforced by the engine. The limits a document respects by its
 * structure are `RECIPE_LIMITS` in `@repo/contracts`. Raising one needs a decision record.
 */
export const RUN_LIMITS = {
  /** Time one step may take, in milliseconds. */
  stepMs: 10_000,
  /** Time the whole run may take, in milliseconds. */
  runMs: 20_000,
  /** Bytes one fetch may return. A fetch has the whole time of its step. */
  responseBytes: 2 * 1024 * 1024,
  /** Redirects one fetch may follow; each is checked by the egress policy again. */
  redirects: 2,
  /** How deep reads of other endpoints may nest: a mix of mixes, and no further. */
  endpointReadDepth: 2,
  /** Time one expression may take to evaluate, in milliseconds. */
  expressionMs: 250,
  /** How deep the evaluation of one expression may nest. */
  expressionDepth: 64,
  /** Characters `text.match` reads; as much text as one fetch may return. */
  matchInputChars: 2 * 1024 * 1024,
} as const;
