import { err, ok } from "@repo/core/result";
import type { BodyReader } from "../body-reader";

/** A chunk of the body, a broken connection, or a source that stops sending. */
export type FakeChunk = Uint8Array | "broken" | "stalled";

/** A `BodyReader` over prepared chunks that counts how often it was asked for one. */
export interface FakeBodyReader extends BodyReader {
  readonly reads: () => number;
}

export function createFakeBodyReader(chunks: readonly FakeChunk[]): FakeBodyReader {
  let reads = 0;
  return {
    reads: () => reads,
    next: () => {
      const chunk = chunks[reads];
      reads += 1;
      if (chunk === "stalled") {
        return new Promise(() => undefined);
      }
      if (chunk === "broken") {
        return Promise.resolve(err({ code: "fetch_failed" }));
      }
      return Promise.resolve(ok(chunk ?? null));
    },
  };
}
