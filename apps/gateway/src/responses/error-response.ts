import { ERROR_STATUS, type ErrorBody, type ErrorCode } from "@repo/contracts/api/error";

/** What the caller should read and do; `internal_error` has no hint, its request id says enough. */
export interface ErrorAnswer {
  readonly code: ErrorCode;
  readonly message: string;
  readonly hint?: string;
  /** Seconds the caller should wait before trying again, sent as `retry-after`. */
  readonly retryAfterS?: number;
}

/** A contract error response: the status of its code and the one error body of `api.md`. */
export function errorResponse({ code, message, hint, retryAfterS }: ErrorAnswer): Response {
  const body: ErrorBody = {
    error: hint === undefined ? { code, message } : { code, message, hint },
  };
  return Response.json(body, {
    status: ERROR_STATUS[code],
    headers: {
      "cache-control": "private, no-store",
      ...(retryAfterS === undefined ? {} : { "retry-after": String(retryAfterS) }),
    },
  });
}
