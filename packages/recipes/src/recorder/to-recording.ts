import type { SourceResponse } from "../ports/source-fetch";
import type { Recording } from "../recording/recording";

/** The recording of a response: its four fields and nothing else, so nothing more is committed. */
export function toRecording(url: string, response: SourceResponse): Recording {
  return { url, status: response.status, contentType: response.contentType, body: response.body };
}
