import { lookup } from "node:dns/promises";
import { err, ok } from "@repo/core/result";
import type { ResolveHost } from "../ports/resolve-host";

/** The part of Node's resolver this adapter uses, so a test can stand in for a failure. */
type Lookup = (
  host: string,
  options: { all: true; verbatim: true },
) => Promise<{ address: string }[]>;

/** The `ResolveHost` of commands and Node entries: every address the system resolver knows. */
export function createNodeResolveHost(resolve: Lookup = lookup): ResolveHost {
  return (host) =>
    resolve(host, { all: true, verbatim: true }).then(
      (found) => ok(found.map((entry) => entry.address)),
      () => err({ code: "unresolved" }),
    );
}
