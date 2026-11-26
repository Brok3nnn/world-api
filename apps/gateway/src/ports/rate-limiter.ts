/** How many calls may come at once, and how fast the allowance comes back. */
export interface CallRate {
  readonly burst: number;
  readonly perSecond: number;
}

/** Whether a call may proceed, or how long its caller should wait. */
type RateDecision =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly retryAfterS: number };

/** Counts calls per key against a rate. */
export interface RateLimiter {
  take(key: string, rate: CallRate): Promise<RateDecision>;
}
