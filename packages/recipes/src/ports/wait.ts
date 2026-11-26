/**
 * Resolves after `ms` milliseconds. Once `signal` aborts it never settles, so a finished fetch
 * can cancel its timer. A port, so a timeout can be tested without the clock.
 */
export type Wait = (ms: number, signal: AbortSignal) => Promise<void>;
