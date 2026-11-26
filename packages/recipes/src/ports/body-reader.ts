import type { Result } from "@repo/core/result";

/** Why the rest of a body could not be read. */
export interface BodyReadFailure {
  readonly code: "fetch_failed";
}

/** Reads a response body chunk by chunk, so its size can be capped while it arrives. */
export interface BodyReader {
  /** The next chunk, `null` after the last one, or a failure when the connection broke. */
  next(): Promise<Result<Uint8Array | null, BodyReadFailure>>;
}
