import { err, ok, type Result } from "@repo/core/result";
import type { Wait } from "../ports/wait";

/** A fetch that ran out of time. */
export interface FetchTimeout {
  readonly code: "fetch_timeout";
}

/** One time budget for everything a fetch waits for: the request, its redirects and the body. */
export interface Deadline {
  /** The operation's value, or `fetch_timeout` when the budget runs out first. */
  race<Value>(operation: Promise<Value>): Promise<Result<Value, FetchTimeout>>;
  /** Aborts when the time is up or the fetch is over, telling the request to give up. */
  readonly signal: AbortSignal;
  /** Ends the fetch: cancels the timer and drops anything still open. */
  finish(): void;
}

export function startDeadline(ms: number, wait: Wait): Deadline {
  const timer = new AbortController();
  const request = new AbortController();
  const expired = wait(ms, timer.signal).then(() => {
    request.abort();
    return err<FetchTimeout>({ code: "fetch_timeout" });
  });
  return {
    race: (operation) => Promise.race([operation.then(ok), expired]),
    signal: request.signal,
    finish: () => {
      timer.abort();
      request.abort();
    },
  };
}
