import type { Result } from "@repo/core/result";

/** One request of an `http.get` step. Only the headers a recipe may set are carried. */
export interface SourceRequest {
  readonly url: string;
  readonly headers: { readonly accept?: string; readonly "accept-language"?: string };
}

/** A response that passed the egress policy, read as text within the size cap. */
export interface SourceResponse {
  readonly status: number;
  /** The media type without parameters, in lowercase; `null` when the source sent none. */
  readonly contentType: string | null;
  readonly body: string;
  readonly bytes: number;
}

/** Why a request produced no response. */
export interface SourceFetchFailure {
  readonly code: "policy_denied" | "fetch_failed" | "fetch_timeout" | "too_large";
}

/**
 * Fetches one URL of an approved source. The engine reaches the network only through this
 * port; the egress policy implements it.
 */
export type SourceFetch = (
  request: SourceRequest,
) => Promise<Result<SourceResponse, SourceFetchFailure>>;
