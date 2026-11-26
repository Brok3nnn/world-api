import type { Result } from "@repo/core/result";
import type { BodyReader } from "./body-reader";

/** One `GET` that the egress policy has approved. */
export interface HttpRequest {
  readonly url: string;
  /** The checked address to connect to. The client must not look the host up again. */
  readonly address: string;
  readonly headers: Readonly<Record<string, string>>;
  /** Aborts when the fetch runs out of time or is over. */
  readonly signal: AbortSignal;
}

/** What the policy needs of a response; the body is read only after the redirects end. */
export interface HttpResponse {
  readonly status: number;
  readonly contentType: string | null;
  readonly location: string | null;
  readonly body: BodyReader;
}

/** A request that got no response: the connection failed. */
export interface HttpClientFailure {
  readonly code: "fetch_failed";
}

/**
 * Sends one `GET` without following redirects. Only the policed fetch calls it: everything else
 * in the package reaches the network through `SourceFetch`.
 */
export type HttpClient = (request: HttpRequest) => Promise<Result<HttpResponse, HttpClientFailure>>;
