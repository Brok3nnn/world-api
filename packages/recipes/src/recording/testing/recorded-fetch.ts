import type { SourceFetch, SourceResponse } from "../../ports/source-fetch";
import { createFakeSourceFetch } from "../../ports/testing/fake-source-fetch";
import type { Recording } from "../recording";

/**
 * A `SourceFetch` that replays recordings. A request for a URL that was not recorded throws,
 * naming the URL, so a test can never reach the network or pass on a guess.
 */
export function createRecordedFetch(recordings: readonly Recording[]): SourceFetch {
  const answers: Record<string, SourceResponse> = {};
  for (const { url, status, contentType, body } of recordings) {
    if (Object.hasOwn(answers, url)) {
      throw new Error(`${url} is recorded twice.`);
    }
    answers[url] = { status, contentType, body, bytes: new TextEncoder().encode(body).byteLength };
  }
  return createFakeSourceFetch(answers);
}
