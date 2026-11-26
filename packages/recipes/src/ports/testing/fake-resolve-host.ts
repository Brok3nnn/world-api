import { err, ok } from "@repo/core/result";
import type { ResolveHost } from "../resolve-host";

/** A `ResolveHost` over a table of names and their addresses; any other name is unresolved. */
export function createFakeResolveHost(
  addresses: Readonly<Record<string, readonly string[]>>,
): ResolveHost {
  return async (host) => {
    const found = addresses[host];
    return found === undefined ? err({ code: "unresolved" }) : ok(found);
  };
}
