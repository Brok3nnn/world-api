import { err, ok } from "@repo/core/result";
import type { SourceFetch, SourceFetchFailure, SourceResponse } from "../source-fetch";

/**
 * A `SourceFetch` that answers each URL with its response, or with its failure code. A URL
 * missing from the table is a mistake in the test, so it throws instead of inventing an answer.
 */
export function createFakeSourceFetch(
  answers: Readonly<Record<string, SourceResponse | SourceFetchFailure["code"]>>,
): SourceFetch {
  return async (request) => {
    const answer = answers[request.url];
    if (answer === undefined) {
      throw new Error(`No fake response for ${request.url}.`);
    }
    return typeof answer === "string" ? err({ code: answer }) : ok(answer);
  };
}
