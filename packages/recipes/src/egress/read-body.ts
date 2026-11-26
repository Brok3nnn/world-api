import { err, ok, type Result } from "@repo/core/result";
import { RUN_LIMITS } from "../engine/run-limits";
import type { BodyReader, BodyReadFailure } from "../ports/body-reader";
import type { Deadline, FetchTimeout } from "./deadline";

/** A body larger than a fetch may return. */
export interface TooLarge {
  readonly code: "too_large";
}

function joined(chunks: readonly Uint8Array[], size: number): Uint8Array {
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

/**
 * Reads a whole body within the deadline and the size cap. It stops at the first chunk that
 * passes the cap, so a source cannot make the engine download more than the cap allows.
 */
export async function readBody(
  reader: BodyReader,
  deadline: Deadline,
): Promise<Result<Uint8Array, BodyReadFailure | FetchTimeout | TooLarge>> {
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const raced = await deadline.race(reader.next());
    if (!raced.ok) {
      return raced;
    }
    if (!raced.value.ok) {
      return raced.value;
    }
    const chunk = raced.value.value;
    if (chunk === null) {
      return ok(joined(chunks, size));
    }
    size += chunk.byteLength;
    if (size > RUN_LIMITS.responseBytes) {
      return err({ code: "too_large" });
    }
    chunks.push(chunk);
  }
}
