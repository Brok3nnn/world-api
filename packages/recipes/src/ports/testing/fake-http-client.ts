import { err, ok } from "@repo/core/result";
import type { HttpClient, HttpRequest } from "../http-client";
import { createFakeBodyReader, type FakeChunk } from "./fake-body-reader";

/** How the fake answers one URL. */
export type FakeHttpAnswer =
  | {
      readonly status: number;
      readonly contentType?: string;
      readonly location?: string;
      readonly body?: string | readonly FakeChunk[];
    }
  | "unreachable"
  | "stalled";

/** An `HttpClient` over a table of answers that remembers every request it was given. */
export interface FakeHttpClient {
  readonly http: HttpClient;
  readonly requests: readonly HttpRequest[];
}

export function createFakeHttpClient(
  answers: Readonly<Record<string, FakeHttpAnswer>>,
): FakeHttpClient {
  const requests: HttpRequest[] = [];
  const http: HttpClient = (request) => {
    requests.push(request);
    const answer = answers[request.url];
    if (answer === undefined) {
      throw new Error(`No fake answer for ${request.url}.`);
    }
    if (answer === "stalled") {
      return new Promise(() => undefined);
    }
    if (answer === "unreachable") {
      return Promise.resolve(err({ code: "fetch_failed" }));
    }
    const body = answer.body ?? "";
    return Promise.resolve(
      ok({
        status: answer.status,
        contentType: answer.contentType ?? null,
        location: answer.location ?? null,
        body: createFakeBodyReader(
          typeof body === "string" ? [new TextEncoder().encode(body)] : body,
        ),
      }),
    );
  };
  return { http, requests };
}
