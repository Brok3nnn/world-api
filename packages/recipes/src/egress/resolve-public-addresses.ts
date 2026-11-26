import { err, ok, type Result } from "@repo/core/result";
import type { ResolveHost } from "../ports/resolve-host";
import { denied, type EgressDenial } from "./egress-denial";
import { isIpLiteral, isPublicAddress } from "./is-public-address";

/** A host that could not be reached at all. */
export interface UnreachableHost {
  readonly code: "fetch_failed";
}

/**
 * The addresses a request to `host` may connect to. Every address the name resolves to must be
 * public: one private answer refuses them all, so a name cannot point a request inside.
 */
export async function resolvePublicAddresses(
  host: string,
  resolveHost: ResolveHost,
): Promise<Result<readonly string[], EgressDenial | UnreachableHost>> {
  const resolved = isIpLiteral(host) ? ok([host]) : await resolveHost(host);
  if (!resolved.ok || resolved.value.length === 0) {
    return err({ code: "fetch_failed" });
  }
  return resolved.value.every(isPublicAddress)
    ? ok(resolved.value)
    : err(denied("address_not_public"));
}
