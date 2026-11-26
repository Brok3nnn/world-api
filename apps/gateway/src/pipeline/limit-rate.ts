import { err, ok, type Result } from "@repo/core/result";
import type { Caller } from "../ports/caller-directory";
import type { CallRate, RateLimiter } from "../ports/rate-limiter";
import type { ErrorAnswer } from "../responses/error-response";

/** An anonymous address may make 60 calls at once, and one more every second (security.md). */
export const ANONYMOUS_CALLS: CallRate = { burst: 60, perSecond: 1 };

/** Lets a call through within its caller's rate, or answers `429 rate_limited` with `retry-after`. */
export async function limitRate(
  caller: Caller,
  limiter: RateLimiter,
): Promise<Result<void, ErrorAnswer>> {
  const decision = await limiter.take(caller.limitKey, ANONYMOUS_CALLS);
  if (decision.allowed) {
    return ok(undefined);
  }
  return err({
    code: "rate_limited",
    message: "Too many calls.",
    hint: `Retry after ${decision.retryAfterS} seconds.`,
    retryAfterS: decision.retryAfterS,
  });
}
