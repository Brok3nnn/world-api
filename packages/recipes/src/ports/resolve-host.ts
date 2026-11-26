import type { Result } from "@repo/core/result";

/** Why a host name gave no addresses. */
export interface ResolveHostFailure {
  readonly code: "unresolved";
}

/**
 * Looks up the addresses of a host name. A port, so the egress policy can check every address
 * before a request is sent, on whichever runtime resolves names.
 */
export type ResolveHost = (host: string) => Promise<Result<readonly string[], ResolveHostFailure>>;
